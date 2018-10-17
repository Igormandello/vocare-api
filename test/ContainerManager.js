const mssql = require('mssql');
const { Docker } = require('node-docker-api');
const docker = new Docker();

function ContainerManager() {
  this.container = null;

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
    console.log('Container built.. starting..');
  
    await container.start();
    console.log('Container started... waiting for boot...');
  
    this.container = container;
    return new Promise((resolve, reject) => {
      this.checkSql().then(() => {
        console.log('Container booted!');
        resolve();
      }).catch(() => {
        console.log('Exited');
        reject();
      });
    });
  }

  this.deleteContainer = function() {
    return new Promise(async resolve => {
      await this.container.delete({ force: true });
      console.log('Container deleted!');
      resolve();
    });
  }

  this.checkSql = function() {
    return new Promise((resolve, reject) => {
      let timeout, interval;
  
      console.log('Attempting connection... ');
      interval = setInterval(() => {
        try {
          mssql.close();
  
          mssql.connect(`mssql://SA:${process.env.CONTAINER_PASSWORD}@localhost/`).then(() => {
            console.log('Connected!');
            clearInterval(interval);
            clearTimeout(timeout);
            mssql.close();
  
            resolve();
          }).catch(() => {});
        }
        catch (e) { }
      }, 1000);
  
      timeout = setTimeout(async () => {
        console.log('Was not able to connect to SQL container in 15000 ms. Exiting..');
        await this.deleteContainer();
  
        reject();
      }, 15000);
    })
  }
}

module.exports = ContainerManager;