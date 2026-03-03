const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });

const doc = {
  info: {
    title: 'Personnel Evaluation System API',
    version: '1.0.0',
    description: 'API for Personnel Evaluation System',
  },
  host: 'localhost:5000',
  basePath: '/',
  schemes: ['http'],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'API สำหรับระบบยืนยันตัวตน' },
    { name: 'Admin', description: 'API สำหรับผู้ดูแลระบบ' },
    { name: 'Evaluatee', description: 'API สำหรับผู้รับการประเมิน' },
    { name: 'Evaluator', description: 'API สำหรับผู้ประเมิน' },
    { name: 'Report', description: 'API สำหรับการออกรายงาน' },
  ],
};

const outputFile = './swagger-output.json';
const endpointsFiles = ['./src/app.js']; // ชี้ไปที่ app.js เพื่อให้มันไล่ตาม routes

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  console.log('Swagger documentation generated successfully!');
});