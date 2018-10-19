const mssql = require('mssql');

var pool;
if (process.env.NODE_ENV === 'test')
  pool = new mssql.ConnectionPool(`mssql://SA:${process.env.CONTAINER_PASSWORD}@localhost/tempdb`);
else
  pool = new mssql.ConnectionPool(`mssql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_SERVER}/${process.env.DB}`);

let db = {
  runSql: function(sql, /**/) {
    let args = Array.prototype.slice.call(arguments, 1);

    return new Promise(async (resolve, reject) => {
      await pool.connect();

      let request = pool.request();
      for (i = 0; i < args.length; i++)
        request = request.input(args[i].name, args[i].type, args[i].value);

      try {
        resolve(await request.query(sql));
      } catch (e) {
        reject(e);
      } finally {
        pool.close();
      }
    })
  }
}

module.exports = db;