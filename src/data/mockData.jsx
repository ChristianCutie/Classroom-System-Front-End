export const initialUser = {
  id: "u1",
  name: "Dr. Eleanor Vance",
  email: "e.vance@university.edu",
  avatar: "EV",
  color: "#1a73e8",
  role: "teacher" // can be toggled to 'student'
};

export const bannerGradients = [
  { id: "blue", name: "Classic Blue", css: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)", color: "#1a73e8" },
  { id: "green", name: "Emerald Forest", css: "linear-gradient(135deg, #1e8e3e 0%, #0b5345 100%)", color: "#1e8e3e" },
  { id: "teal", name: "Ocean Teal", css: "linear-gradient(135deg, #00897b 0%, #004d40 100%)", color: "#00897b" },
  { id: "purple", name: "Royal Purple", css: "linear-gradient(135deg, #8e24aa 0%, #4a148c 100%)", color: "#8e24aa" },
  { id: "orange", name: "Sunset Orange", css: "linear-gradient(135deg, #e65100 0%, #bf360c 100%)", color: "#e65100" },
  { id: "dark", name: "Midnight Slate", css: "linear-gradient(135deg, #37474f 0%, #263238 100%)", color: "#37474f" }
];

export const initialClasses = [
  {
    id: "c1",
    name: "CS101: Advanced React & Bootstrap",
    section: "Spring 2026 - Section A",
    subject: "Computer Science",
    room: "Lab 402",
    code: "rcbt50a",
    teacher: { name: "Dr. Eleanor Vance", avatar: "EV", email: "e.vance@university.edu" },
    isTeaching: true,
    isArchived: false,
    banner: "linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%)",
    themeColor: "#1a73e8",
    announcements: [
      {
        id: "a1",
        author: { name: "Dr. Eleanor Vance", avatar: "EV" },
        date: "Today, 10:30 AM",
        text: "Welcome to CS101! Please make sure you have Node.js v20+ installed on your machines before Friday's lab session. Check out the Classwork tab for Unit 1 materials.",
        attachments: [
          { type: "pdf", name: "CS101_Syllabus_Spring2026.pdf", url: "#" },
          { type: "drive", name: "React Starter Setup Guide", url: "#" }
        ],
        comments: [
          { id: "cm1", author: "Alex Rivera", avatar: "AR", text: "Got it, thank you Dr. Vance! Is Bootstrap 5.3 acceptable?", date: "10:45 AM" },
          { id: "cm2", author: "Dr. Eleanor Vance", avatar: "EV", text: "Yes Alex, Bootstrap 5+ is perfect.", date: "11:02 AM" }
        ]
      },
      {
        id: "a2",
        author: { name: "Dr. Eleanor Vance", avatar: "EV" },
        date: "Mar 12, 4:15 PM",
        text: "Friendly reminder: Group project team formations are due by the end of this week. Post your team members here or email me.",
        attachments: [],
        comments: []
      }
    ],
    topics: ["Unit 1: Foundations", "Unit 2: Bootstrap 5 Layouts", "Unit 3: Component Architecture", "Final Project"],
    classwork: [
      {
        id: "cw1",
        title: "Assignment 1: Responsive Grid Dashboard",
        type: "assignment",
        topic: "Unit 2: Bootstrap 5 Layouts",
        dueDate: "Tomorrow, 11:59 PM",
        points: 100,
        instructions: "Create a responsive 3-column admin dashboard layout utilizing Bootstrap 5 grid utilities, responsive breakpoints, and card components. Submit your repository link or zipped project.",
        attachments: [
          { type: "doc", name: "Dashboard_Specification.docx", url: "#" }
        ],
        postedDate: "Mar 10",
        stats: { turnedIn: 18, assigned: 6, graded: 4 }
      },
      {
        id: "cw2",
        title: "Quiz 1: Bootstrap Utilities & Flexbox",
        type: "quiz",
        topic: "Unit 2: Bootstrap 5 Layouts",
        dueDate: "Mar 20, 5:00 PM",
        points: 50,
        instructions: "Complete the Google Form quiz covering Bootstrap spacing (m-, p-), flexbox alignment, and display utilities.",
        attachments: [
          { type: "form", name: "Quiz 1: Flexbox & Grid Form", url: "#" }
        ],
        postedDate: "Mar 11",
        stats: { turnedIn: 22, assigned: 2, graded: 19 }
      },
      {
        id: "cw3",
        title: "Lecture Notes & Cheat Sheet: React Components",
        type: "material",
        topic: "Unit 1: Foundations",
        dueDate: null,
        points: null,
        instructions: "Download and review these comprehensive slides before starting Assignment 2.",
        attachments: [
          { type: "pdf", name: "React_Component_Lifecycle_Hooks.pdf", url: "#" },
          { type: "youtube", name: "React Component Deep Dive Video", url: "#" }
        ],
        postedDate: "Mar 8",
        stats: null
      },
      {
        id: "cw4",
        title: "Discussion: What is your favorite CSS framework?",
        type: "question",
        topic: "Unit 1: Foundations",
        dueDate: "Mar 15, 11:59 PM",
        points: 10,
        instructions: "Answer the prompt in 2-3 sentences and reply to at least one classmate.",
        attachments: [],
        postedDate: "Mar 5",
        stats: { turnedIn: 24, assigned: 0, graded: 24 }
      }
    ],
    students: [
      { id: "s1", name: "Alex Rivera", avatar: "AR", email: "a.rivera@university.edu", status: "Active" },
      { id: "s2", name: "Maya Lin", avatar: "ML", email: "m.lin@university.edu", status: "Active" },
      { id: "s3", name: "Samuel Jackson", avatar: "SJ", email: "s.jackson@university.edu", status: "Active" },
      { id: "s4", name: "Chloe Bennett", avatar: "CB", email: "c.bennett@university.edu", status: "Active" },
      { id: "s5", name: "Liam O'Connor", avatar: "LO", email: "l.oconnor@university.edu", status: "Active" },
      { id: "s6", name: "Zoe Patel", avatar: "ZP", email: "z.patel@university.edu", status: "Active" }
    ],
    grades: [
      { studentId: "s1", cw1: 95, cw2: 48, cw4: 10 },
      { studentId: "s2", cw1: 100, cw2: 50, cw4: 10 },
      { studentId: "s3", cw1: 88, cw2: 45, cw4: 8 },
      { studentId: "s4", cw1: 92, cw2: 46, cw4: 10 },
      { studentId: "s5", cw1: null, cw2: 42, cw4: 9 }, // missing cw1
      { studentId: "s6", cw1: 98, cw2: 49, cw4: 10 }
    ]
  },
  {
    id: "c2",
    name: "MATH202: Linear Algebra & Matrix Theory",
    section: "Spring 2026 - Room 102B",
    subject: "Mathematics",
    room: "Hall B",
    code: "mt202xy",
    teacher: { name: "Prof. Alan Turing", avatar: "AT", email: "a.turing@university.edu" },
    isTeaching: false, // Enrolled class
    isArchived: false,
    banner: "linear-gradient(135deg, #00897b 0%, #004d40 100%)",
    themeColor: "#00897b",
    announcements: [
      {
        id: "a10",
        author: { name: "Prof. Alan Turing", avatar: "AT" },
        date: "Yesterday, 2:00 PM",
        text: "Practice problems for Eigenvalues and Eigenvectors have been uploaded. Midterm exam is next Thursday.",
        attachments: [
          { type: "pdf", name: "Eigenvalues_Practice_Set.pdf", url: "#" }
        ],
        comments: []
      }
    ],
    topics: ["Chapter 1: Vectors", "Chapter 2: Matrices & Determinants", "Chapter 3: Eigenvalues"],
    classwork: [
      {
        id: "cw10",
        title: "Problem Set 4: Determinants & Cramer's Rule",
        type: "assignment",
        topic: "Chapter 2: Matrices & Determinants",
        dueDate: "Friday, 5:00 PM",
        points: 50,
        instructions: "Solve problems 1 through 12 from page 142. Show all work cleanly.",
        attachments: [
          { type: "pdf", name: "ProblemSet4_Questions.pdf", url: "#" }
        ],
        postedDate: "Mar 14",
        stats: null,
        userSubmission: { status: "assigned", grade: null }
      }
    ],
    students: [
      { id: "s1", name: "Alex Rivera", avatar: "AR", email: "a.rivera@university.edu" },
      { id: "u1", name: "Dr. Eleanor Vance", avatar: "EV", email: "e.vance@university.edu" }
    ],
    grades: []
  },
  {
    id: "c3",
    name: "ART105: Digital Illustration & UI Design",
    section: "Studio 3",
    subject: "Fine Arts",
    room: "Design Lab 1",
    code: "art105d",
    teacher: { name: "Dr. Eleanor Vance", avatar: "EV", email: "e.vance@university.edu" },
    isTeaching: true,
    isArchived: false,
    banner: "linear-gradient(135deg, #8e24aa 0%, #4a148c 100%)",
    themeColor: "#8e24aa",
    announcements: [
      {
        id: "a20",
        author: { name: "Dr. Eleanor Vance", avatar: "EV" },
        date: "Mar 10, 9:00 AM",
        text: "Please download Figma or Sketch before our next studio walkthrough.",
        attachments: [],
        comments: []
      }
    ],
    topics: ["Color Theory", "Vector Drawing", "Typography"],
    classwork: [
      {
        id: "cw20",
        title: "Project 1: Brand Identity System",
        type: "assignment",
        topic: "Color Theory",
        dueDate: "Next Monday, 11:59 PM",
        points: 100,
        instructions: "Design a logo, color palette, and typography system for a fictional clean energy startup.",
        attachments: [],
        postedDate: "Mar 9",
        stats: { turnedIn: 15, assigned: 10, graded: 0 }
      }
    ],
    students: [
      { id: "s2", name: "Maya Lin", avatar: "ML", email: "m.lin@university.edu" },
      { id: "s4", name: "Chloe Bennett", avatar: "CB", email: "c.bennett@university.edu" }
    ],
    grades: [
      { studentId: "s2", cw20: null },
      { studentId: "s4", cw20: 94 }
    ]
  },
  {
    id: "c4",
    name: "PHYS101: Classical Mechanics & Thermodynamics",
    section: "Lecture Hall A",
    subject: "Physics",
    room: "Science Bldg 204",
    code: "ph101nw",
    teacher: { name: "Prof. Richard Feynman", avatar: "RF", email: "r.feynman@university.edu" },
    isTeaching: false,
    isArchived: false,
    banner: "linear-gradient(135deg, #e65100 0%, #bf360c 100%)",
    themeColor: "#e65100",
    announcements: [],
    topics: ["Newton's Laws", "Energy Conservation"],
    classwork: [],
    students: [],
    grades: []
  },
  {
    id: "c5",
    name: "HIST102: Modern World History & Geopolitics",
    section: "Fall 2025",
    subject: "History",
    room: "Humanities 310",
    code: "hs102ar",
    teacher: { name: "Dr. Eleanor Vance", avatar: "EV", email: "e.vance@university.edu" },
    isTeaching: true,
    isArchived: true, // Archived class
    banner: "linear-gradient(135deg, #37474f 0%, #263238 100%)",
    themeColor: "#37474f",
    announcements: [],
    topics: [],
    classwork: [],
    students: [],
    grades: []
  }
];
