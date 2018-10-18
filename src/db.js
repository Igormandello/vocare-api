const mssql = require('mssql');

const pool;
if (process.env.NODE_ENV === 'test')
  pool = mssql.ConnectionPool(`mssql://SA:${process.env.CONTAINER_PASSWORD}@localhost/tempdb`);
else
  pool = mssql.ConnectionPool(`mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB}`);

let db = {
  runSql: function(sql) {
    return new Promise(resolve => {
      await pool.connect();

      let result = await pool.request()
        .query(sql)
        .catch(e => {
          console.log(e);
        });

      await pool.close();
      resolve(result);
    })
  }
}

module.exports = db;