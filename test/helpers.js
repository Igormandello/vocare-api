const supertest = require('supertest');
const chai = require('chai');
const app = require('../src/index.js');

global.app = app;
global.expect = chai.expect;
global.request = supertest(app);