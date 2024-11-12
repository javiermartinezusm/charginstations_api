// src/index.js

import koa from 'koa'
import bodyParser from 'koa-body'
import router from './routes/index.js'
import cors from '@koa/cors';

const app = new koa()
const port = 5000

    
app.use(cors())
app.use(bodyParser({ multipart: true, urlencoded: true }))
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});