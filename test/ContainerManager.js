const mssql = require('mssql');
const { Docker } = require('node-docker-api');
const docker = new Docker();

function ContainerManager() {
  this.container;
  this.connection;

  this.createContainer = async function() {
    const container = await docker.container.create({
      Image: 'microsoft/mssql-server-linux:2017-latest',
      name: 'mssql',
      ExposedPorts: { '1433/tcp': {} },
      HostConfig: {
        PortBindings: {
          '1433/tcp': [{ HostPort: '1433' }]
        }
      },
      Env: [`SA_PASSWORD=${process.env.CONTAINER_PASSWORD}`, 'ACCEPT_EULA=Y']
    });
    console.log('Container built. Starting...');
  
    await container.start();
    console.log('Container started. Waiting for boot...');
  
    this.container = container;
    return new Promise((resolve, reject) => {
      this.checkSql().then(async (connection) => {
        console.log('Container booted!');
        this.connection = connection;
        resolve();
      }).catch(() => {
        console.log('Exited');
        reject();
      });
    });
  }

  this.deleteContainer = function() {
    return new Promise(async resolve => {
      await mssql.close();
      await this.container.delete({ force: true });
      console.log('Container deleted!');
      resolve();
    });
  }

  this.execSql = function(sql) {
    return this.connection.request()
      .query(sql)
      .catch(e => {
        console.log(e);
      });
  }

  this.checkSql = function() {
    return new Promise((resolve, reject) => {
      let timeout, interval;
  
      console.log('Attempting connection...');
      interval = setInterval(() => {
        try {
          mssql.close();
  
          mssql.connect(`mssql://SA:${process.env.CONTAINER_PASSWORD}@localhost/tempdb`).then(async () => {
            mssql.close();
            let connection = await new mssql
                              .ConnectionPool(`mssql://SA:${process.env.CONTAINER_PASSWORD}@localhost/tempdb`)
                              .connect();

            console.log('Connected!');
            clearInterval(interval);
            clearTimeout(timeout);
  
            resolve(connection);
          }).catch(() => {});
        }
        catch (e) { }
      }, 100);
  
      timeout = setTimeout(async () => {
        console.log('Was not able to connect to SQL container in 30000 ms. Exiting...');
        await this.deleteContainer();
  
        reject();
      }, 30000);
    })
  }
}

module.exports = ContainerManager;
