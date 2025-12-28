const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Database Module', () => {
  let mockMysql2;
  let db;
  let mockPool;
  let mockConnection;

  beforeEach(() => {
    // Mock connection object
    mockConnection = {
      execute: sinon.stub(),
      end: sinon.stub().resolves(),
      release: sinon.stub()
    };

    // Mock pool object
    mockPool = {
      getConnection: sinon.stub().resolves(mockConnection)
    };

    // Mock mysql2/promise module
    mockMysql2 = {
      createPool: sinon.stub().returns(mockPool)
    };

    // Clear require cache to get fresh module instance
    delete require.cache[require.resolve('../db')];
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Database Connection', () => {
    it('should create pool with correct configuration', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      // Initialize the pool
      await db.getConnection();

      expect(mockMysql2.createPool.calledOnce).to.be.true;
      
      const callArgs = mockMysql2.createPool.getCall(0).args[0];
      expect(callArgs).to.include({
        host: 'localhost',
        user: 'root',
        password: 'password123',
        database: 'db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
    });

    it('should export query method', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      expect(db).to.have.property('query');
      expect(typeof db.query).to.equal('function');
    });

    it('should execute parameterized queries', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      const mockResults = [{ id: 1, name: 'Test' }];
      mockConnection.execute.resolves([mockResults, []]);

      const result = await db.query('SELECT * FROM data WHERE id = ?', [1]);

      expect(mockConnection.execute.calledOnce).to.be.true;
      expect(mockConnection.execute.getCall(0).args[0]).to.equal('SELECT * FROM data WHERE id = ?');
      expect(mockConnection.execute.getCall(0).args[1]).to.deep.equal([1]);
      expect(result).to.deep.equal(mockResults);
    });
  });

  describe('Connection Configuration', () => {
    it('should use correct host configuration', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      await db.getConnection();

      const config = mockMysql2.createPool.getCall(0).args[0];
      expect(config.host).to.equal('localhost');
    });

    it('should use correct database name', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      await db.getConnection();

      const config = mockMysql2.createPool.getCall(0).args[0];
      expect(config.database).to.equal('db');
    });

    it('should configure connection pool with correct limits', async () => {
      db = proxyquire('../db', {
        'mysql2/promise': mockMysql2
      });

      await db.getConnection();

      const config = mockMysql2.createPool.getCall(0).args[0];
      expect(config.connectionLimit).to.equal(10);
      expect(config.queueLimit).to.equal(0);
    });
  });
});
