import app from './app';
import config from './config';

import path from 'path';
import greenlock from 'greenlock-express';
//port 7000번에서 듣고있으면(7000번켜지면) 실행함수 실행해라
const { PORT } = config;

greenlock
    .init({
        packageRoot: path.join(__dirname, '../'),
        configDir: path.join(__dirname, '../', 'blogserver/config/greenlock.d'),
        maintainerEmail: 'u_1379@naver.com',
        cluster: false,
    })
    .serve(app, () => {
        console.log('greenlock working');
    });

app.listen(PORT, () => {
    console.log(`server started on Port ${PORT}`);
});
