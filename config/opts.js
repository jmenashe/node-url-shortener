import yargs from 'yargs';
yargs
  .usage('Usage: $0 [options]')
  .alias('u', 'url')
  .describe('u', 'Application URL')
  .default('u', 'http://127.0.0.1:3000')
  .alias('p', 'port')
  .describe('p', 'Port number for the Express application')
  .default('p', 3000)
  .describe('redis-host', 'Redis Server hostname')
  .default('redis-host', 'localhost')
  .describe('redis-port', 'Redis Server port number')
  .default('redis-port', 6379)
  .describe('redis-pass', 'Redis Server password')
  .default('redis-pass', false)
  .describe('redis-db', 'Redis DB index')
  .default('redis-db', 0)
  .help('h')
  .alias('h', 'help')
  .argv;

export default yargs;