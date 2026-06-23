# Notification App Frontend

This is the React app I built for students to view their campus notifications. I took over an incomplete codebase and finished the implementation.

The app has two pages. The first one shows all notifications with a filter so you can see only Placements, Results, or Events. Unread notifications are highlighted with a blue dot on the left side and a bold title. Once you click on a notification it gets marked as read and the style changes. There is also a mark all read button at the top.

The second page is the Priority Inbox. It shows the most important notifications first. Placement notifications have the highest priority, followed by Results, and then Events. Newer notifications also rank higher. You can use the slider to choose how many you want to see, from 3 to 10.

I used localStorage to track which notifications have been read so it persists when you refresh the page.

## How to run

```
npm install
npm run dev
```

Go to http://localhost:3000 in your browser.

## What I used

React for building the UI, Material UI for the components and styling, and Vite as the build tool.
