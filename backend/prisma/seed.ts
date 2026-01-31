import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Seed exercises
  const exercises = [
    {
      name: 'Squat',
      category: 'strength',
      muscleGroups: JSON.stringify(['Legs', 'Quads', 'Glutes']),
      description: 'Lower body compound exercise',
      instructions: 'Stand with feet shoulder-width apart, lower your body by bending knees and hips',
      isPoseTrackable: true,
    },
    {
      name: 'Push-up',
      category: 'strength',
      muscleGroups: JSON.stringify(['Chest', 'Shoulders', 'Triceps']),
      description: 'Upper body bodyweight exercise',
      instructions: 'Start in plank position, lower body until chest nearly touches floor, push back up',
      isPoseTrackable: true,
    },
    {
      name: 'Bicep Curl',
      category: 'strength',
      muscleGroups: JSON.stringify(['Biceps']),
      description: 'Isolation exercise for biceps',
      instructions: 'Hold weights at sides, curl up by bending elbows, lower slowly',
      isPoseTrackable: true,
    },
    {
      name: 'Bench Press',
      category: 'strength',
      muscleGroups: JSON.stringify(['Chest', 'Shoulders', 'Triceps']),
      description: 'Upper body compound exercise',
      instructions: 'Lie on bench, lower bar to chest, press up',
      isPoseTrackable: false,
    },
    {
      name: 'Deadlift',
      category: 'strength',
      muscleGroups: JSON.stringify(['Back', 'Legs', 'Glutes', 'Hamstrings']),
      description: 'Full body compound exercise',
      instructions: 'Stand with feet hip-width, bend at hips and knees, lift bar, stand up straight',
      isPoseTrackable: false,
    },
    {
      name: 'Pull-up',
      category: 'strength',
      muscleGroups: JSON.stringify(['Back', 'Biceps']),
      description: 'Upper body pulling exercise',
      instructions: 'Hang from bar, pull body up until chin over bar, lower slowly',
      isPoseTrackable: false,
    },
    {
      name: 'Running',
      category: 'cardio',
      muscleGroups: JSON.stringify(['Legs', 'Calves', 'Core']),
      description: 'Cardiovascular exercise',
      instructions: 'Maintain steady pace, land on midfoot, keep posture upright',
      isPoseTrackable: false,
    },
    {
      name: 'Plank',
      category: 'strength',
      muscleGroups: JSON.stringify(['Core', 'Abs']),
      description: 'Core stability exercise',
      instructions: 'Hold body in straight line, support on forearms and toes',
      isPoseTrackable: false,
    },
  ];

  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: {},
      create: exercise,
    });
  }

  console.log(`✅ Seeded ${exercises.length} exercises`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
