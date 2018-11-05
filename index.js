
const Koa = require('koa');
const Router = require('koa-router');
const fs = require('fs');
const bodyParser = require('koa-bodyparser');
const http=require('http');
const https=require('https');
const app = new Koa();
app.use(bodyParser());
const router = new Router();
var pg = require("pg");

var db = new pg.Pool({

    user: 'scira',

    host: '0.tcp.ngrok.io',

    database: 'postgres',

    password: 'password',

    port: 11753,

  });
router.get('/', (ctx, next) => {
  ctx.set('Content-Type', 'text/html');
  ctx.body = fs.readFileSync('reportForm.html','utf8');
});
router.get('/axios.min.js',(ctx,next)=>{
  ctx.set('Content-Type', 'text/javascript');
  ctx.body = fs.readFileSync('axios.min.js','utf8');
});
router.post('/', async (ctx, next) => {
  const formSubmission=ctx.request.body
  console.log(ctx.request.body.selectedRoad)
  const res = await db.query(`UPDATE roads SET is_closed=true WHERE ogc_fid=${formSubmission.selectedRoad}`)
ctx.redirect('/');
});
router.get('/nearestRoad/:lat/:long',async (ctx,next)=>{
  const lat=ctx.params.lat;
  const long=ctx.params.long;
  const res = await db.query(`SELECT
    r.ogc_fid,
    r.is_closed,
    LEAST(r.fromleft,r.toleft,r.fromright,r.toright) || ' to ' || GREATEST(r.fromleft,r.toleft,r.fromright,r.toright) || ' block of ' ||  r.predir || ' ' || r.streetname || ' ' || r.streettype as street,
    ST_Distance(ST_SetSRID(ST_MakePoint(-90.193301,38.631071),4326),ST_SetSRID(r.wkb_geometry,4326)) as distance
    from roads r
ORDER BY distance ASC
LIMIT 1;`)
//console.log(res.rows[0])
      ctx.set('Content-Type', 'application/json');
      ctx.body=res.rows[0]
})
router.get('/nearestRoads/:lat/:long',async (ctx,next)=>{
  const lat=ctx.params.lat;
  const long=ctx.params.long;
  const res = await db.query(`SELECT
    r.ogc_fid,
    LEAST(r.fromleft,r.toleft,r.fromright,r.toright) || ' to ' || GREATEST(r.fromleft,r.toleft,r.fromright,r.toright) || ' block of ' ||  r.predir || ' ' || r.streetname || ' ' || r.streettype as street,
    ST_Distance(ST_SetSRID(ST_MakePoint(-90.193301,38.631071),4326),ST_SetSRID(r.wkb_geometry,4326)) as distance
    from roads r
ORDER BY distance ASC
LIMIT 10;`)

      ctx.set('Content-Type', 'application/json');
      ctx.body=res.rows
})
app
  .use(router.routes())
  .use(router.allowedMethods());
  
http.createServer(app.callback()).listen(3000,()=>console.log('listening over http on 3000'));
//https.createServer(app.callback()).listen(3001,()=>console.log('listening over https on 3001'));
