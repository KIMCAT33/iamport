// 모듈 셋팅
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const AWS = require('aws-sdk');
const axios = require('axios');
const mongoose = require('./.config/database');

// random 숫자 생성기
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}


const port = process.env.PORT || 3000;

// DB 셋팅
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
const namyangsuModel = require('./models/namyangsu');


// 서버 상태 셋팅
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));



// 서버 동작 확인
app.get('/', (request, response) => {
  response.send("success");
  console.log("success");
});


app.post("/certifications", async (request, response) => {
  //const { imp_uid, UserPhone } = request.body;
  const imp_uid = request.body.data.imp_uid; // request의 body에서 imp_uid 추출
  const UserPhone = request.body.data.UserPhone;
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

    const { name, gender, birthday } = certificationsInfo;
    console.log(certificationsInfo);
    const phone = UserPhone;
    const name_ = name;
    const birth = birthday;

    var query = { phone: phone }
    namyangsuModel.findOne(query).then(function (userInfo) {
      if (userInfo == undefined) {
        // DB 조회 시 사용자가 없으면
        response.json({ status: "fail", message: "지급 대상자가 아닙니다." });
      } else { // DB 조회 시 사용자가 있으면
        if (userInfo.count < 1) { // 지급 회수가 1번 이하인 경우에만 인증번호 지급
          number = getRandomInt(0, 9999);
          var now = new Date();
          namyangsuModel.findOneAndUpdate(query, { randomNumber: number, date: now }, function (err, userInfo) {
            response.json({ status: "success", message: "지급 회수 1번 이하인 경우 인증 번호 발급 완료", randomNumber: number, phone: phone });
          });
        } else {
          response.json({ status: "fail", message: "지급 회수 1번 초과인 사용자입니다." });
        }
      }
    });

  } catch (e) {
    console.error(e);
  }

});

app.post('/check', function (request, response) {
  // request로 request.body.randomNumber
  flag = request.body.flag;
  randomNumber_ = request.body.randomNumber;
  var query = { randomNumber: randomNumber_ };
  namyangsuModel.findOne(query, function (err, userInfo) {
    if (userInfo == undefined) {
      response.json({ status: "fail", message: "투출 시점에서 등록되지 않은 사용자입니다." });
    }
    else {
      var updateCount = userInfo.count + 1;
      namyangsuModel.findOneAndUpdate(query, { count: updateCount, randomNumber: 10000, flag: flag }, function (err, newUserInfo) {
        response.json({ status: "success", message: "마스크 보급을 완료하였습니다.", name: userInfo.name });
      });
    }
  });


});

// 키오스크에서 유저의 randomNumber가 맞는지 검증
app.post('/find', function (request, response) {
  randomNumber_ = request.body.randomNumber;
  var query = { randomNumber: randomNumber_ };
  namyangsuModel.findOne(query, function (err, userInfo) {
    if (err) {
      next(err);
    } else {
      if (userInfo == undefined) {
        response.json({ status: "fail", message: "등록되지 않은 인증번호 정보입니다." });
      } else {
        response.json({ status: "success", message: "등록된 인증번호 입니다.", name: userInfo.name, randomNumber: randomNumber_ });
      }
    }

  });
});

// 유저 삭제 api
app.post('/delete', function (request, response) {
  var phone = request.body.phone;
  var query = { phone: phone };
  namyangsuModel.findOneAndDelete(query, function (err, userInfo) {
    if (err) {
      next(err);
    }
    if (userInfo == undefined) {
      response.json({ status: "fail", message: "등록되지 않은 유저 정보이므로 삭제할 수 없습니다." });
    } else {
      response.json({ status: "success", message: "유저 정보를 삭제하였습니다.", data: userInfo });
    }
  });
});

app.listen(port,'0.0.0.0', function () {
  console.log(`Node server listening on port ${port}`);
});