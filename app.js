const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const port = process.env.PORT || 3000;



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));




app.get('/', (request, response)=>{
    response.send("success");
})

app.post("/certifications", async (request, response) => {
    const { imp_uid } = request.body; // request의 body에서 imp_uid 추출
    try {
      // 인증 토큰 발급 받기
      const getToken = await axios({
        url: "https://api.iamport.kr/users/getToken",
        method: "post", // POST method
        headers: { "Content-Type": "application/json" }, // "Content-Type": "application/json"
        data: {
          imp_key: "8929671166349938", // REST API키
          imp_secret: "jUG6nQ8cNq7uaeGRV1kQYFFx5ioNbfzu9fBx5JJTaRnl64d15xS4cyBiQZ51eEvoU7VZRFT1whmDlzFr" // REST API Secret
        }
      });
      const { access_token } = getToken.data.response; // 인증 토큰
      // imp_uid로 인증 정보 조회
      const getCertifications = await axios({
        url: `https://api.iamport.kr/certifications/${imp_uid}`, // imp_uid 전달
        method: "get", // GET method
        headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
      });
      const certificationsInfo = getCertifications.data.response; // 조회한 인증 정보
      console.log(certificationsInfo);
      const { unique_key, name, gender, birthday } = certificationsInfo;
    } catch(e) {
      console.error(e);
    }
});


app.listen(port, function(){
    console.log(`Node server listening on port ${port}`);
})