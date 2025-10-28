# School Management System - Frontend

A modern and beautiful school management application built with React, Vite, and Tailwind CSS.

## Features

- 📊 **Dashboard**: Overview of students, teachers, courses, and revenue statistics
- 👥 **Student Management**: Complete CRUD operations for managing students
- 👨‍🏫 **Teacher Management**: Manage teacher profiles and information
- 📚 **Course Management**: Create and manage courses with student enrollment
- ⚙️ **Settings**: Account settings and preferences
- 🎨 **Modern UI**: Beautiful and responsive design with Tailwind CSS
- 🔄 **Smooth Navigation**: Sidebar navigation with route highlighting

## Tech Stack

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

1. Navigate to the project directory:
```bash
cd school_fe
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Build for production:

```bash
npm run build
```

### Preview

Preview the production build:

```bash
npm run preview
```

## Project Structure

```
school_fe/
├── src/
│   ├── components/
│   │   └── Layout.jsx          # Main layout with sidebar
│   ├── pages/
│   │   ├── Dashboard.jsx       # Dashboard page
│   │   ├── Students.jsx        # Students management
│   │   ├── Teachers.jsx        # Teachers management
│   │   ├── Courses.jsx         # Courses management
│   │   └── Settings.jsx        # Settings page
│   ├── App.jsx                 # Main app component with routing
│   ├── main.jsx                # Entry point
│   └── index.css               # Tailwind CSS imports
├── public/                     # Static assets
└── package.json                # Dependencies
```

## Features in Detail

### Dashboard
- Statistics cards showing total students, teachers, courses, and revenue
- Recent students list
- Performance overview with charts
- Quick action buttons

### Students
- Search functionality
- View all students in a table
- Student details with avatar, email, course, and grade
- Edit and delete actions

### Teachers
- Grid view of teacher cards
- Contact information (email, phone)
- Department and experience details
- Edit and delete actions

### Courses
- Tabbed interface (All, Active, Archived)
- Search functionality
- Course details with student count and duration
- Edit and delete actions

### Settings
- Organized settings categories
- Profile, notifications, security, and preferences
- Account management options

## Customization

The design uses a custom color scheme defined in `tailwind.config.js`. The primary color is a blue shade (#0ea5e9).

To customize colors, edit `tailwind.config.js`:

```js
colors: {
  primary: {
    // Your custom colors
  }
}
```

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!