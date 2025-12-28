const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');
const fs = require('fs');
const path = require('path');
const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const formData = require('express-form-data');
const os = require('os');

describe('Routes - Index Router', () => {
  let mockDb;
  let router;
  let app;

  beforeEach(() => {
    // Mock database with async API
    mockDb = {
      query: sinon.stub()
    };

    // Create Express app
    app = express();
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'pug');
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Setup form data parsing
    const options = {
      uploadDir: os.tmpdir(),
      autoClean: true
    };
    app.use(formData.parse(options));
    app.use(formData.format());
    app.use(formData.stream());
    
    app.use(cookieParser());
    app.use(express.static(path.join(__dirname, '../public')));

    // Mock router
    router = proxyquire('../routes/index', {
      '../db': mockDb,
      'uuid': { v4: () => 'test-uuid-1234' }
    });

    app.use('/', router);

    // Error handler
    app.use((err, req, res, next) => {
      res.status(err.status || 500).send(err.message);
    });

    // Mock file system for writeFile
    sinon.stub(fs.promises, 'writeFile').resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('GET /', () => {
    it('should render index page with correct data', (done) => {
      request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /html/)
        .end(done);
    });
  });

  describe('POST /new', () => {
    it('should return 400 if image is not provided', (done) => {
      request(app)
        .post('/new')
        .field('name', 'Test Image')
        .field('description', 'A test image')
        .field('author', 'Test Author')
        .expect(400)
        .expect((res) => {
          expect(res.body.error).to.equal('image required');
        })
        .end(done);
    });

    it('should return 400 when no fields are provided', (done) => {
      request(app)
        .post('/new')
        .expect(400)
        .expect((res) => {
          expect(res.body.error).to.exist;
        })
        .end(done);
    });
  });

  describe('GET /all', () => {
    it('should return all images from database', (done) => {
      const mockImages = [
        { id: 1, name: 'Image 1', description: 'Desc 1', author: 'Author 1', path: 'path1.jpg' },
        { id: 2, name: 'Image 2', description: 'Desc 2', author: 'Author 2', path: 'path2.jpg' }
      ];

      mockDb.query.resolves(mockImages);

      request(app)
        .get('/all')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).to.be.true;
          expect(res.body.count).to.equal(2);
          expect(res.body.data).to.deep.equal(mockImages);
          expect(mockDb.query.calledOnce).to.be.true;
        })
        .end(done);
    });

    it('should handle database errors when fetching images', (done) => {
      const dbError = new Error('Database query failed');
      mockDb.query.rejects(dbError);

      request(app)
        .get('/all')
        .expect(500)
        .expect((res) => {
          expect(res.body.error).to.equal('fetch_failed');
        })
        .end(done);
    });

    it('should return empty array for no images', (done) => {
      mockDb.query.resolves([]);

      request(app)
        .get('/all')
        .expect(200)
        .expect((res) => {
          expect(res.body.success).to.be.true;
          expect(res.body.count).to.equal(0);
          expect(res.body.data).to.deep.equal([]);
        })
        .end(done);
    });
  });
});
