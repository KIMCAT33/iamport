// 모듈 셋팅
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AWS = require('aws-sdk');
const axios = require('axios');

// random 숫자 생성기
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


const port = process.env.PORT || 3000;

// DB 셋팅
const namyangsuModel = require('./models/namyangsu');


// 서버 상태 셋팅
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



// 서버 동작 확인
app.get('/', (request, response) => {
  response.send("success");
})


app.post("/certifications", async (request, response) => {
 
  const imp_uid = request.body.data.imp_uid; // request의 body에서 imp_uid 추출

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
    const url_ = `https://api.iamport.kr/certifications/${imp_uid}`;
    const getCertifications = await axios({
      url: url_,// imp_uid 전달
      method: "get", // GET method
      headers: { "Authorization": access_token } // 인증 토큰 Authorization header에 추가
    });
    const certificationsInfo = getCertifications.data.response; // 조회한 인증 정보

    const { unique_key, name, gender, birthday } = certificationsInfo;

    const phone = unique_key;
    const name_ = name;
    const birth = birthday;
    
    // DB에 있는지 파악 
    // DB 조회 시 없으면, 사용자, 이름, 전화번호 등 추가 후 date, 업데이트 하고 randomNumber return
    // DB 조회 시 있으면, count > 1 이면 date 확인 후 현재 시간으로부터 30분 이상 지나지 않았으면 error 리턴, 
    //                   count < 0 이면 count 증가 후 date 업데이트 후, randomNumber return 
    var query = { phone: phone }
    namyangsuModel.findOne(query, function (err, userInfo) {
      if (err) {
        // 사용자가 없으면
        var number = getRandomInt(0, 9999);
        namyangsuModel.create({
          phone: phone,
          name: name_,
          birth: birth,
          randomNumber: number,
          data: Date.now(), function(err, result) {
            if (err) {
              next(err);
            }
            else {
              response.json({
                status: "success",
                randomNumber: number,
                message: "사용자가 처음 등록 후 인증 번호를 받았습니다."
              });
            }
          }
        })
      } else { // 사용자가 있으면
        response.json({state: "normal"});
      }
    });
    
  } catch (e) {
  console.error(e);
}

});


app.listen(port, function () {
  console.log(`Node server listening on port ${port}`);
})