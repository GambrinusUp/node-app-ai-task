const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Database Module', () => {
  let mockMysql2;
  let db;

  beforeEach(() => {
    // Mock mysql2 module
    mockMysql2 = {
      createConnection: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Database Connection', () => {
    it('should create connection with correct credentials', () => {
      const mockConnection = {
        query: sinon.stub(),
        connect: sinon.stub()
      };

      mockMysql2.createConnection.returns(mockConnection);

      db = proxyquire('../db', {
        'mysql2': mockMysql2
      });

      expect(mockMysql2.createConnection.calledOnce).to.be.true;
      
      const callArgs = mockMysql2.createConnection.getCall(0).args[0];
      expect(callArgs).to.include({
        host: 'localhost',
        user: 'root',
        password: 'password123',
        database: 'db'
      });
    });

    it('should export connection object', () => {
      const mockConnection = {
        query: sinon.stub()
      };

      mockMysql2.createConnection.returns(mockConnection);

      db = proxyquire('../db', {
        'mysql2': mockMysql2
      });

      expect(db).to.have.property('connection');
      expect(db.connection).to.equal(mockConnection);
    });

    it('should expose query method on connection', () => {
      const mockConnection = {
        query: sinon.stub()
      };

      mockMysql2.createConnection.returns(mockConnection);

      db = proxyquire('../db', {
        'mysql2': mockMysql2
      });

      expect(db.connection).to.have.property('query');
      expect(typeof db.connection.query).to.equal('function');
    });
  });

  describe('Connection Configuration', () => {
    it('should use correct host configuration', () => {
      const mockConnection = {};
      mockMysql2.createConnection.returns(mockConnection);

      db = proxyquire('../db', {
        'mysql2': mockMysql2
      });

      const config = mockMysql2.createConnection.getCall(0).args[0];
      expect(config.host).to.equal('localhost');
    });

    it('should use correct database name', () => {
      const mockConnection = {};
      mockMysql2.createConnection.returns(mockConnection);

      db = proxyquire('../db', {
        'mysql2': mockMysql2
      });

      const config = mockMysql2.createConnection.getCall(0).args[0];
      expect(config.database).to.equal('db');
    });
  });
});
