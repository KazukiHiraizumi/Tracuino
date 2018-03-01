#include <Firmata.h>
#include <FJAX.h>
#include <WebUSB.h>

const WebUSBURL URLS[] = {
  { 1, "www.c-able.ne.jp/~hirai551/fjax/" },
  { 0, "localhost:8000" },
};

const uint8_t ALLOWED_ORIGINS[] = { 1, 2 };

WebUSB SerialXX(URLS, 2, 1, ALLOWED_ORIGINS, 2);

struct {
  byte step;
  word pduty;
  word nduty;
  word tmr;
  long ts;
} co;
struct {
  word ffbk;
} lp;

void *seg[]={&co,&lp};

void setup(){
//  SerialXX.begin(9600);
  Firmata.begin(SerialXX);
  FJAX.setup(SerialXX,Firmata,seg);
  co.step=0;
  co.tmr=1000;
  co.pduty=200;
  co.nduty=200;
  pinMode(13, OUTPUT);
}
void loop(){
//  if (SerialXX && SerialXX.available()) {
//    byte r=SerialXX.read();
//    SerialXX.write(r);
//    SerialXX.flush();
//    if(co.step&1) digitalWrite(13, HIGH);
//    else digitalWrite(13, LOW);
//    co.step++;
//  }
//  return;

  if(!FJAX.check()) return;

  lp.ffbk=analogRead(0);

  switch(co.step){
  case 0:
    pinMode(3,INPUT);
    pinMode(5,INPUT);
    pinMode(9,INPUT);
    pinMode(10,INPUT);
    co.ts=millis();
    break;
  case 1:
    if(millis()-co.ts>co.tmr) co.step=0;
    pinMode(3,OUTPUT);
    pinMode(10,OUTPUT);
    digitalWrite(3,HIGH);
    digitalWrite(10,LOW);
    break;
  case 2:
    if(millis()-co.ts>co.tmr) co.step=0;
    pinMode(5,OUTPUT);
    pinMode(9,OUTPUT);
    digitalWrite(5,HIGH);
    digitalWrite(9,LOW);
    break;
  }
}

