
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  await prisma.issueSprint.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.issue.deleteMany()
  await prisma.sprint.deleteMany()
  await prisma.status.deleteMany()
  await prisma.project.deleteMany()
  await prisma.invitation.deleteMany()
  await prisma.organizationMember.deleteMany()
  await prisma.organization.deleteMany()
  await prisma.user.deleteMany()

  console.log('Cleared existing data.')


  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // Create User
  const user = await prisma.user.create({
    data: {
      email: 'demo@taskverse.com',
      name: 'Demo User',
      hashedPassword: hashedPassword,
    },
  });

  console.log(`Created user: ${user.name} (${user.email})`);

  // Create Organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Org',
      slug: 'demo-org',
      ownerId: user.id,
    },
  });

  await prisma.organizationMember.create({
    data: {
        userId: user.id,
        organizationId: organization.id,
        role: 'OWNER',
    }
  })

  console.log(`Created organization: ${organization.name}`);

  // Create Scrum Project
  const scrumProject = await prisma.project.create({
    data: {
      name: 'Alpha Project',
      key: 'ALPHA',
      type: 'SCRUM',
      organizationId: organization.id,
      leadId: user.id,
    },
  });

  console.log(`Created SCRUM project: ${scrumProject.name}`);
  
  // Create Kanban Project
  const kanbanProject = await prisma.project.create({
    data: {
      name: 'Bravo Project',
      key: 'BRAVO',
      type: 'KANBAN',
      organizationId: organization.id,
      leadId: user.id,
    },
  });

  console.log(`Created KANBAN project: ${kanbanProject.name}`);

  // Create statuses for Scrum Project
  const scrumStatuses = [
    { name: 'To Do', category: 'TODO', order: 1, projectId: scrumProject.id },
    { name: 'In Progress', category: 'IN_PROGRESS', order: 2, projectId: scrumProject.id },
    { name: 'Done', category: 'DONE', order: 3, projectId: scrumProject.id },
  ];
  await prisma.status.createMany({ data: scrumStatuses });
  
  const scrumStatusMap = (await prisma.status.findMany({ where: { projectId: scrumProject.id } })).reduce((acc, status) => {
    acc[status.name] = status;
    return acc;
  }, {} as Record<string, { id: string }>);
  console.log(`Created statuses for ${scrumProject.name}`);

  // Create statuses for Kanban Project
  const kanbanStatuses = [
    { name: 'Backlog', category: 'TODO', order: 1, projectId: kanbanProject.id },
    { name: 'Selected for Development', category: 'TODO', order: 2, projectId: kanbanProject.id },
    { name: 'In Progress', category: 'IN_PROGRESS', order: 3, projectId: kanbanProject.id },
    { name: 'Done', category: 'DONE', order: 4, projectId: kanbanProject.id },
  ];
  await prisma.status.createMany({ data: kanbanStatuses });

  const kanbanStatusMap = (await prisma.status.findMany({ where: { projectId: kanbanProject.id } })).reduce((acc, status) => {
    acc[status.name] = status;
    return acc;
  }, {} as Record<string, { id: string }>);

  console.log(`Created statuses for ${kanbanProject.name}`);

  // Create sprint for Scrum project
  const sprint1 = await prisma.sprint.create({
    data: {
        name: 'Alpha Sprint 1',
        projectId: scrumProject.id,
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(new Date().setDate(new Date().getDate() + 14)),
        goal: "Get the basics working and ship a prototype."
    }
  });

  console.log(`Created sprint ${sprint1.name} for ${scrumProject.name}`);

  // Create issues for Scrum Project
  const scrumIssuesData = [
    { title: 'Set up database schema', type: 'TASK', priority: 'HIGH', statusId: scrumStatusMap['Done'].id },
    { title: 'Implement user authentication', type: 'STORY', priority: 'CRITICAL', assigneeId: user.id, statusId: scrumStatusMap['In Progress'].id, description: 'Users should be able to sign up and log in using their email and password. Session management should be implemented.' },
    { title: 'Design project board UI', type: 'STORY', priority: 'MEDIUM', statusId: scrumStatusMap['To Do'].id, description: 'Create a visually appealing and intuitive board UI with columns for statuses and draggable issue cards.' },
    { title: 'Login button not working on mobile', type: 'BUG', priority: 'HIGH', statusId: scrumStatusMap['To Do'].id },
    { title: 'Deploy to staging environment', type: 'TASK', priority: 'MEDIUM', statusId: scrumStatusMap['To Do'].id },
  ];

  const createdScrumIssues = [];
  for (let i = 0; i < scrumIssuesData.length; i++) {
    const issue = await prisma.issue.create({
      data: {
        ...scrumIssuesData[i],
        key: `${scrumProject.key}-${i + 1}`,
        projectId: scrumProject.id,
        reporterId: user.id,
      },
    });
    createdScrumIssues.push(issue);
  }

  // Assign some issues to the active sprint
  await prisma.issueSprint.createMany({
    data: [
      { issueId: createdScrumIssues[1].id, sprintId: sprint1.id },
      { issueId: createdScrumIssues[2].id, sprintId: sprint1.id },
      { issueId: createdScrumIssues[3].id, sprintId: sprint1.id },
    ]
  });


  // Add a comment to an issue
  await prisma.comment.create({
    data: {
        body: "I've started working on this. The backend part is almost complete.",
        authorId: user.id,
        issueId: createdScrumIssues[1].id
    }
  });

  console.log(`Created issues for ${scrumProject.name}`);
  
  // Create issues for Kanban Project
  const kanbanIssuesData = [
    { title: 'Develop marketing website', type: 'EPIC', priority: 'MEDIUM', statusId: kanbanStatusMap['In Progress'].id, assigneeId: user.id },
    { title: 'API performance is slow on staging', type: 'BUG', priority: 'HIGH', statusId: kanbanStatusMap['Selected for Development'].id },
    { title: 'Add search functionality', type: 'TASK', priority: 'MEDIUM', statusId: kanbanStatusMap['Backlog'].id },
  ];

  for (let i = 0; i < kanbanIssuesData.length; i++) {
    await prisma.issue.create({
      data: {
        ...kanbanIssuesData[i],
        key: `${kanbanProject.key}-${i + scrumIssuesData.length + 1}`,
        projectId: kanbanProject.id,
        reporterId: user.id,
      },
    });
  }

  console.log(`Created issues for ${kanbanProject.name}`);


  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
