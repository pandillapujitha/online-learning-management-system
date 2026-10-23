// Tiny JSON-file data store. Swap this module for MongoDB / PostgreSQL / DynamoDB
// when deploying to a real cloud database - the routes only use load() and save().
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const FILE = process.env.DB_FILE || path.join(__dirname, 'data', 'db.json');
let db = null;

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function seed() {
  const instructorId = 'u-instructor';
  const studentId = 'u-student';
  const q = (question, options, answer) => ({ id: uid(), question, options, answer });
  const l = (title, duration, content) => ({ id: uid(), title, duration, content });

  return {
    users: [
      { id: instructorId, name: 'Dr. Meera Rao', email: 'instructor@lms.com', role: 'instructor', password: bcrypt.hashSync('instructor123', 8) },
      { id: studentId, name: 'Arjun Kumar', email: 'student@lms.com', role: 'student', password: bcrypt.hashSync('student123', 8) }
    ],
    courses: [
      {
        id: 'c-cloud', title: 'Cloud Computing Fundamentals', category: 'Cloud', level: 'Beginner', instructorId,
        description: 'Understand IaaS, PaaS and SaaS, virtualization, containers and how applications are deployed on the cloud.',
        lessons: [
          l('What is cloud computing?', 12, 'Cloud computing delivers computing resources - servers, storage, databases and networking - over the internet on a pay-as-you-go basis. Key traits: on-demand self-service, broad network access, resource pooling, rapid elasticity and measured service.'),
          l('Service models: IaaS, PaaS, SaaS', 15, 'IaaS gives you virtual machines and networks (AWS EC2). PaaS gives you a managed runtime (Heroku, Render, Elastic Beanstalk). SaaS is a finished application used through a browser (Gmail, this LMS).'),
          l('Virtualization and containers', 18, 'Virtual machines emulate full hardware and run a guest OS. Containers share the host kernel and package only the app and its dependencies, so they start faster and use less memory. Docker is the most common container tool.'),
          l('Deploying a web app', 20, 'A typical deployment: build the app, package it in a Docker image, push the image to a registry, run it on a cloud service behind a load balancer, and store data in a managed database.')
        ],
        quiz: [
          q('Which service model gives you virtual machines and networks?', ['SaaS', 'PaaS', 'IaaS', 'DaaS'], 2),
          q('Containers differ from virtual machines because they...', ['Need a full guest OS each', 'Share the host kernel', 'Cannot run web apps', 'Only run on mobile'], 1),
          q('Gmail is an example of which model?', ['SaaS', 'IaaS', 'PaaS', 'On-premise'], 0)
        ]
      },
      {
        id: 'c-web', title: 'Full-Stack Web Development', category: 'Web', level: 'Intermediate', instructorId,
        description: 'Build modern web apps with HTML, CSS, JavaScript, Node.js and React from the ground up.',
        lessons: [
          l('HTML and CSS essentials', 25, 'HTML describes the structure of a page; CSS controls layout and appearance. Learn semantic tags, the box model, flexbox and grid.'),
          l('JavaScript in the browser', 30, 'JavaScript adds behaviour: select elements, listen to events, call APIs with fetch, and update the page without reloading.'),
          l('Building a REST API with Node.js', 28, 'Express lets you define routes such as GET /api/courses. Use middleware for JSON parsing, authentication and error handling.'),
          l('React components and state', 30, 'React builds the UI from components. State (useState) holds data that changes; effects (useEffect) load data from the API.')
        ],
        quiz: [
          q('Which hook loads data when a component first renders?', ['useState', 'useEffect', 'useRef', 'useMemo'], 1),
          q('Which tool is used here to build a REST API?', ['Express', 'Bootstrap', 'jQuery', 'Sass'], 0)
        ]
      },
      {
        id: 'c-db', title: 'Databases and SQL Basics', category: 'Data', level: 'Beginner', instructorId,
        description: 'Learn relational modelling, SELECT queries, joins and how to choose between SQL and NoSQL.',
        lessons: [
          l('Tables, rows and keys', 15, 'A relational database stores data in tables. A primary key identifies each row; a foreign key links a row to another table.'),
          l('Writing SELECT queries', 20, 'SELECT columns FROM table WHERE condition ORDER BY column. Use LIMIT to restrict the number of rows returned.'),
          l('Joins', 22, 'INNER JOIN returns rows that match in both tables. LEFT JOIN keeps every row from the left table even when there is no match.')
        ],
        quiz: [
          q('Which key links one table to another?', ['Primary key', 'Foreign key', 'Secret key', 'Cache key'], 1)
        ]
      }
    ],
    enrollments: [
      { id: uid(), userId: studentId, courseId: 'c-cloud', completed: [], quizScore: null, enrolledAt: new Date().toISOString() }
    ]
  };
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

function load() {
  if (db) return db;
  if (fs.existsSync(FILE)) {
    db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } else {
    db = seed();
    save();
  }
  return db;
}

module.exports = { load, save, uid };
