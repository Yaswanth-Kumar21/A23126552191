# Notification System Design

## Stage 1

### REST API Design

The campus notification platform needs to support fetching, filtering, and marking notifications. Users are pre-authorised — no login flow needed.

#### Endpoints

**GET /api/notifications**
Fetch paginated list of notifications for the logged-in user.

Request Headers:
```
Authorization: Bearer <token>
```

Query Parameters:
```
page          - page number (default: 1)
limit         - items per page (default: 10)
notification_type - filter by type: Event | Result | Placement
```

Response:
```json
{
  "notifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Result",
      "Message": "mid-sem results are out",
      "Timestamp": "2026-04-22 17:51:30",
      "isRead": false
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

---

**GET /api/notifications/priority**
Returns top N priority notifications. Priority is calculated by type weight and recency.

Query Parameters:
```
limit - number of top notifications to return (default: 10)
notification_type - optional filter
```

Response:
```json
{
  "notifications": [...],
  "total": 10
}
```

---

**PATCH /api/notifications/:id/read**
Mark a single notification as read.

Response:
```json
{
  "message": "notification marked as read"
}
```

---

**PATCH /api/notifications/read-all**
Mark all notifications as read.

Response:
```json
{
  "message": "all notifications marked as read"
}
```

---

### Real-Time Notification Design

For real-time delivery, I would use **Server-Sent Events (SSE)**.

**GET /api/notifications/stream**

The client opens a persistent connection to this endpoint. When a new notification arrives on the server, it is pushed immediately to the connected client without polling.

Why SSE over WebSockets: Notifications are one-directional (server to client). SSE is simpler, works over standard HTTP, and handles reconnection automatically. WebSockets would be over-engineering for this use case.

---

## Stage 2

### Database Choice: PostgreSQL

I would use **PostgreSQL** (relational database) for the following reasons:

- Notifications have a fixed, predictable schema (ID, Type, Message, Timestamp, isRead, studentID)
- We need to filter by multiple columns (studentID, isRead, notificationType, createdAt) — SQL handles this efficiently with indexes
- ACID compliance ensures no notification is lost or duplicated
- Pagination with OFFSET/LIMIT is straightforward

### DB Schema

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');
```

### Queries Based on Stage 1 APIs

Fetch paginated notifications:
```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

Filter by type:
```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = $1 AND type = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

Mark as read:
```sql
UPDATE notifications
SET is_read = true
WHERE id = $1 AND student_id = $2;
```

### Problems as Data Volume Grows

With 50,000 students and millions of notifications:

1. **Slow queries** — full table scans without proper indexes
2. **Large result sets** — fetching all rows before filtering
3. **Write contention** — bulk inserts slow down reads
4. **Disk space** — old notifications accumulate

### Solutions

- Add composite indexes on (student_id, created_at) and (student_id, is_read)
- Partition the notifications table by month (range partitioning on created_at)
- Archive notifications older than 6 months to a cold storage table
- Use connection pooling (PgBouncer) to handle concurrent DB connections

---

## Stage 3

### Is the query accurate?

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

The query is logically correct — it fetches all unread notifications for a student ordered oldest first. However it has performance issues.

### Why is it slow?

With 5,000,000 notifications and 50,000 students, this query does a **full table scan** because there is no index on `(studentID, isRead)`. PostgreSQL has to check every row in the table to find ones matching studentID = 1042.

`SELECT *` also fetches all columns including large text fields — unnecessary data transfer.

### What I would change

```sql
SELECT id, type, message, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = false
ORDER BY created_at ASC;
```

And add this index:
```sql
CREATE INDEX idx_notifications_student_unread
ON notifications (student_id, is_read, created_at ASC)
WHERE is_read = false;
```

This is a **partial index** — it only indexes unread notifications, making it much smaller and faster. The likely cost drops from O(n) full scan to O(log n) index lookup.

### Should we index every column?

No. Adding indexes on every column is bad advice. Each index:
- Slows down INSERT and UPDATE operations (index must be updated on every write)
- Consumes additional disk space
- The query planner can get confused with too many indexes

You should only index columns that appear in WHERE, ORDER BY, or JOIN conditions in your most frequent queries.

### Query: Students who got a Placement notification in the last 7 days

```sql
SELECT DISTINCT student_id
FROM notifications
WHERE type = 'Placement'
AND created_at >= NOW() - INTERVAL '7 days';
```

---

## Stage 4

### Problem

Fetching notifications from DB on every page load for every student is causing DB overload and slow user experience.

### Solutions and Tradeoffs

**Option 1: In-Memory Cache (Redis)**

Cache the notifications list per student with a TTL of 60 seconds.

```
Key: notifications:student:{studentID}:page:{page}
Value: JSON array of notifications
TTL: 60 seconds
```

Tradeoff: A student might see slightly stale data for up to 60 seconds after a new notification arrives. Acceptable for most cases. Invalidate the cache immediately when a new notification is created for that student.

This is the best first option — easy to implement, massive performance gain.

**Option 2: Pagination + Lazy Loading**

Instead of loading all notifications at once, load only the first page (10 items). Load more only when user scrolls or clicks next.

Tradeoff: Reduces DB load significantly. But unread count still needs a separate lightweight query.

**Option 3: Database Read Replicas**

Route all read queries to a replica and writes to the primary.

Tradeoff: There is replication lag — replica might be slightly behind primary. More infrastructure cost. Best for very high traffic but overkill at the student notification scale initially.

**Recommended Approach**

Start with Redis caching (Option 1) combined with pagination (Option 2). Add read replicas only if the cache is not enough after measuring.

---

## Stage 5

### Problem with the current implementation

```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

**Shortcomings:**

1. **Sequential processing** — each student is processed one at a time. For 50,000 students this takes extremely long
2. **No failure recovery** — if `send_email` fails at student 200, the loop stops. Students 201-50000 get nothing
3. **Tight coupling** — email, DB write, and push notification are all in the same loop. One failure blocks the others
4. **No retry mechanism** — failed emails are lost permanently

### What happens when send_email fails for 200 students midway?

With the current code, the loop crashes or skips. Those 200 students never receive anything. There is no way to know which ones failed without extra logging.

### Should saving to DB and sending email happen together?

No. They should be decoupled. Saving to DB should happen first and separately. Email is an external service that can fail — the notification should still be saved in the app even if the email fails.

### Redesigned Solution

Use a **message queue** (like Redis Queue or BullMQ).

```
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        save_to_db(student_id, message)
        enqueue_job("send_email", { student_id, message })
        enqueue_job("push_to_app", { student_id, message })
```

Worker processes pick up jobs from the queue independently:

```
email_worker():
    job = dequeue("send_email")
    result = send_email(job.student_id, job.message)
    if result.failed:
        retry(job, max_attempts=3, backoff=exponential)

push_worker():
    job = dequeue("push_to_app")
    push_to_app(job.student_id, job.message)
```

**Why this is better:**
- DB write is synchronous and immediate — notification exists in the app right away
- Email failures don't affect DB writes or push notifications
- Failed jobs are retried automatically up to 3 times with exponential backoff
- Multiple worker instances can run in parallel — 50,000 emails can be processed concurrently
- The loop finishes instantly since it only enqueues — actual sending happens in background

---

## Stage 6

### Priority Inbox Approach

Priority is calculated using a combination of type weight and recency score.

Type weights:
- Placement = 3
- Result = 2
- Event = 1

Recency score is calculated as a decay factor — newer notifications score higher.

Final score = typeWeight * recencyScore

To maintain top 10 efficiently as new notifications come in, a **min-heap of size N** is used. When a new notification arrives, if its score is higher than the minimum in the heap, it replaces the minimum. This ensures O(log N) insertion instead of re-sorting the entire list.

See `priority-inbox.js` in the root of this repository for the implementation.

---

## Stage 7

### Frontend Architecture

The React frontend (`notification-app-fe`) has two pages:

1. **Notifications Page** — shows all notifications with pagination and type filter. Unread notifications are visually distinct. Clicking marks them as read.

2. **Priority Inbox Page** — shows top N most important unread notifications. User can control N and filter by type.

The logging middleware is integrated at the `api`, `hook`, and `page` layers using `Log("frontend", ...)` calls.

The app fetches data from `http://4.224.186.213/evaluation-service/notifications` with the Bearer token in the Authorization header.
