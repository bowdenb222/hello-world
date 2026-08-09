# 📚 Class &amp; Assignment Tracker

A simple, private system for tracking your **courses, class schedule, assignments, reading, exams, and due dates** — all in one place.

It's a single file (`tracker.html`) that runs in any web browser on your phone, tablet, or laptop. No account, no internet connection, no install. Your data stays on your device.

## Getting started

1. Open **`tracker.html`** in any browser (double-click it, or drag it into a browser window).
2. Click **⋯ Data → Load sample data** to see how it works with example courses and assignments.
3. When you're ready, click **⋯ Data → Erase everything** and add your own.

> **Tip:** Bookmark the file (or add it to your phone's home screen) so it's one tap away. On a computer, keep the file somewhere safe like your Documents folder.

## How the system works

The tracker has four tabs:

| Tab | What it's for |
|-----|---------------|
| **Dashboard** | Your home base. Shows what's **overdue**, **due today**, and **due this week**, plus today's classes and your next 8 deadlines. |
| **Assignments &amp; Reading** | The full list of everything you have to do. Filter by course, type, or status; sort by due date; check things off. |
| **Weekly Schedule** | A Monday–Sunday grid of all your class meeting times. |
| **Courses** | Add your courses with color, instructor, and recurring meeting times. |

### The workflow

1. **Add your courses first** (Courses tab). Give each a color and its weekly meeting times — this builds your schedule automatically.
2. **Add tasks as they come up** (Assignments &amp; Reading tab, or the "+ Add" button on the Dashboard). Each task can be an assignment, reading, exam/quiz, project, or other — with a course, due date, optional time, notes, and an estimated time.
3. **Check the Dashboard daily.** Overdue items turn red, due-today items turn amber. Check tasks off as you finish them.

## Features

- ✅ **Smart due dates** — items are automatically labeled *Overdue*, *Today*, *Tomorrow*, or *In N days*.
- 🎨 **Color-coded courses** across the whole app.
- 🗓️ **Auto-built weekly schedule** from your class meeting times.
- 🔎 **Filter &amp; sort** your task list by course, type, and status.
- 🌗 **Light / dark theme** (click *◐ Theme*).
- 📱 **Works offline** on any device.

## Backup &amp; moving between devices

Because your data lives in one browser, use the **⋯ Data** menu to keep it safe and portable:

- **Export backup (JSON)** — saves a file with all your courses and tasks. Do this occasionally so you never lose anything.
- **Import backup** — load that file on another device (or after clearing your browser) to restore everything.
- **Export due dates (.ics)** — download all your deadlines as a calendar file you can import into **Google Calendar, Apple Calendar, or Outlook**.

## Good habits

- Add assignments the moment they're announced — even without a due date yet.
- Do a weekly review (Sunday evening works well): scan the week ahead, set statuses to *In progress*, and export a fresh backup.
- Use the **Notes** field for page numbers, submission links, and exam coverage.

---

*Everything is stored locally in your browser via `localStorage`. Clearing your browser data will erase it — so keep a backup.*
