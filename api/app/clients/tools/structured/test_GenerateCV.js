const GenerateCV = require('./GenerateCV');

// Test the GenerateCV tool
async function testGenerateCV() {
  console.log('Testing GenerateCV tool...');
  
  // Create an instance with override to avoid needing the API key
  const cvTool = new GenerateCV({
    override: true,
    GENERATE_CV_API_KEY: 'test-key',
    GENERATE_CV_API_URL: 'https://cv.tritium-d.com/api/v1/submit-form/'
  });
  
  // Sample CV data matching the Python schema
  const testData = {
    name: 'John Doe',
    position: 'Software Engineer',
    info: [
      {
        icon: 'email',
        data: 'john.doe@example.com'
      },
      {
        icon: 'phone',
        data: '+1-555-123-4567'
      },
      {
        icon: 'address',
        data: '123 Main St, City, State 12345'
      }
    ],
    summary: 'Experienced software engineer with 5+ years in web development, specializing in React and Node.js applications.',
    skill: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
    education: [
      {
        place: 'University of Technology',
        major: 'Computer Science',
        time: '2015-2019',
        extra: 'Bachelor of Science, Graduated Magna Cum Laude'
      }
    ],
    experience: [
      {
        place: 'Tech Corp',
        phase: [
          {
            time: '2020-2023',
            position: 'Software Engineer',
            detail: ['Developed web applications using React and Node.js', 'Led a team of 3 junior developers', 'Improved application performance by 40%']
          }
        ]
      },
      {
        place: 'StartupXYZ',
        phase: [
          {
            time: '2019-2020',
            position: 'Junior Developer',
            detail: ['Built mobile applications and worked with APIs', 'Collaborated with design team on UI/UX improvements']
          }
        ]
      }
    ],
    project: [
      {
        place: 'Personal Project',
        phase: [
          {
            time: '2023',
            position: 'Full Stack Developer',
            detail: ['Built a task management application', 'Used React, Node.js, and MongoDB']
          }
        ]
      }
    ],
    reference: [
      {
        name: 'Jane Smith',
        position: 'Senior Manager',
        phone: '+1-555-987-6543',
        email: 'jane.smith@techcorp.com'
      }
    ]
  };
  
  try {
    console.log('Calling CV generation tool with test data...');
    console.log('Test data:', JSON.stringify(testData, null, 2));
    
    const result = await cvTool._call(testData);
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

// Run the test
testGenerateCV();