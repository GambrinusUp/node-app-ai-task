const { expect } = require('chai');
const request = require('supertest');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

describe('App Integration Tests', () => {
  let app;
  let mockDb;

  beforeEach(() => {
    // Mock database
    mockDb = {
      connection: {
        query: sinon.stub()
      }
    };

    // Create app with proper configuration
    app = express();
    
    // Setup view engine
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'pug');
    
    // Setup middleware
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../public')));
    
    // Mock router
    const mockRouter = proxyquire('../routes/index', {
      '../db': mockDb
    });
    
    app.use('/', mockRouter);

    // 404 handler
    app.use((req, res, next) => {
      res.status(404).send('Not Found');
    });

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).send(err.message);
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Root Route', () => {
    it('should respond with status 200 to GET /', (done) => {
      request(app)
        .get('/')
        .expect(200, done);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for undefined routes', (done) => {
      request(app)
        .get('/undefined-route')
        .expect(404, done);
    });
  });

  describe('CORS Handling', () => {
    it('should handle CORS requests', (done) => {
      request(app)
        .get('/')
        .expect(200, done);
    });
  });

  describe('Get All Images Route', () => {
    it('should call database query', (done) => {
      mockDb.connection.query.yields(null, [], []);

      request(app)
        .get('/all')
        .expect(200)
        .expect((res) => {
          expect(mockDb.connection.query.calledOnce).to.be.true;
        })
        .end(done);
    });

    it('should return images from database', (done) => {
      const mockImages = [
        { id: 1, name: 'Image 1', path: 'image1.jpg' },
        { id: 2, name: 'Image 2', path: 'image2.jpg' }
      ];

      mockDb.connection.query.yields(null, mockImages, []);

      request(app)
        .get('/all')
        .expect(200)
        .expect((res) => {
          expect(res.body).to.deep.equal(mockImages);
        })
        .end(done);
    });

    it('should handle database errors gracefully', (done) => {
      const dbError = new Error('Connection failed');
      mockDb.connection.query.yields(dbError);

      request(app)
        .get('/all')
        .expect(500, done);
    });
  });
});
