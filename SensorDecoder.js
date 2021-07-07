var AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

exports.handler = async (event, context) => {
   
   //for anything other than demo mode
   
   
  function Decode(bytes) {
    var s = '0x';
    bytes.forEach(function(byte) {
        s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
    });
    
        let string=autoCase(s);
        return string;
    
    }
    
    function autoCase(hex){
    
          let new_hex = "";
        if (hex.substr(0,2)== '0x'){
            new_hex=preatyHex(hex);
        }
        else {
            new_hex=hex;
        }
        console.log(new_hex);
    
        // console.log(new_hex.substr(0,2)==00);
        // console.log(new_hex.substr(4,2)==00);
        
        let hexLength=new_hex.length;
        // console.log(new_hex.substr(hexLength-2,2));
        
        // console.log(hexLength);
        let string = "";
        if (hexLength ==28 && new_hex.substr(0,2)=='0e') {
            console.log('LoraDemo');
            string = DecodeLoraDemo(new_hex);
        }
        else if ((new_hex.substr(0,2)=='1d' && new_hex.substr(hexLength-2,2)== '1d') && hexLength>=26) {
            console.log('SurveySweep')
            string=DecodeSurveySweep(new_hex);
        }
        
        else if (hexLength>=22 && (new_hex.substr(0,2)=='00' && new_hex.substr(4,2)== '00')){
            console.log('SurveyGPS')
        
            // new_hex=new_hex+'00000000000000000000';
            string=DecodeSurveyGPS(new_hex);
        }
    
        return string;
    }
    
    function DecodeLoraDemo(hex){
    
        var xAc=parseInt(hex.substr(2,2),16)*0.0625;
        var yAc=parseInt(hex.substr(4,2),16)*0.0625;
        var zAc=parseInt(hex.substr(6,2),16)*0.0625;
        var presure=parseInt(hex.substr(10,6),16)*0.25/1000;
        var lux=parseInt(hex.substr(18,4),16)*0.25;
        var temperature=parseInt(hex.substr(24,4),16)*0.0625;
        
        return {"acceleration_X":xAc, "acceleration_Y":yAc, "acceleration_Z":zAc, "presure":presure, "lux":lux, "temperature":temperature};
    }
    
    function DecodeSurveyGPS(hex){
    
        var temperature=parseInt(hex.substr(2,2),16);
        var lat=parseInt(hex.substr(6,8),16)/(Math.pow(2,31)-1)*90;
        var long=parseInt(hex.substr(14,8),16)/(Math.pow(2,31)-1)*180;
        
        if (long > 180) {
            long=(360-long)*(-1);
        }
        return {"temperature":temperature, "LatitudeGPS":lat, "LongitudeGPS":long};
    }
    
    function DecodeSurveySweep (hex){
    
        var QosUpLink = hex.substr(2,10); //4 bytes
        var NumberOfGateways = parseInt(QosUpLink.substr(2,4),16);
        var Margin=parseInt(QosUpLink.substr(6,2),16);
        var TxPower=parseInt(QosUpLink.substr(8,2),16);
        
        var QosDownLink = hex.substr(12,8); //3 bytes
        var RSSI=parseInt(QosDownLink.substr(2,4),16);
        var SNR=parseInt(QosDownLink.substr(6,2),16);
        
        var LockStatus =parseInt(hex.substr(22,2),16).toString(2); //1 byte
        var gpsStatus=checkgpsStatus(LockStatus.substr(0,4));
        var numberOfSatelit = parseInt(LockStatus.substr(4,4),2);
        
        var LatitudeGPS = hex.substr(24,10); //4 bytes
        var LongitudeGPS =hex.substr(34,12); //5 bytes
        
        return {"10_qosUpLink": QosUpLink,
            "11_numberOfGateways": NumberOfGateways,
            "12_margin": Margin,
            "13_txPower": TxPower,
            "20_qosDownLink": QosDownLink,
            "21_rSSI": RSSI,
            "22_SNR": SNR,
            "30_LockStatus": LockStatus,
            "1_gpsStatus": gpsStatus,
            "32_numberOfSatelit": numberOfSatelit,
            "40_LatitudeGPS": LatitudeGPS,
            "50_LongitudeGPS": LongitudeGPS};
    }
    
    function checkgpsStatus(byteString){
    /**
    0 No GPS device detected.
    1 No fix
    2 2D fix – only latitude, longitude, and time are valid
    3 3D fix – all data valid
    
    ex: 1100
    **/
    
    let resultat='';
    
    if (byteString.substr(0,1)==0){
        resultat += 'No GPS device detected, ';
    }
    else if (byteString.substr(0,1)==1){
        resultat += 'GPS device detected, ';
    }
    
    if (byteString.substr(1,1)==1){
        resultat += 'No Fix ';
    }
    else if (byteString.substr(2,1)==1) {
        resultat += '2DFix ';
    }
    else if (byteString.substr(3,1)==1) {
        resultat += '3DFix ';
    }
    
    return resultat;
    }
    
    function preatyHex(hex){
        if (hex.substr(0,2)=='0x'){
            hex=hex.substr(2,hex.length);
        }
        return hex;
    }


function toDecode(bytes) {
    var evb_sensors = {};
    var EVB_TYPE = {
      none: 0,
      led_1: 1,
      led_2: 2,
      lux_max: 3,
      lux_min: 4,
      lux: 5,
      barometer_max: 6,
      barometer_min: 7,
      barometer: 8,
      temperature_max: 9,
      temperature__min: 10,
      temperature: 11,
      accelerometer_max: 12,
      accelerometer_min: 13,
      accelerometer: 14,
      tx_interval: 15,
      amps_max: 16,
      amps_min: 17,
      amps: 18,
      m2x_device: 19,
      m2x_key: 20,
    };
    
    /*
     * Process the EVB LoRa payload.
     *
     * EVB payload contains one or more TLV fields.
     *
     * [<type: accelerometer><length: 6><x-high><x-low><y-high><y-low><z-high><z-low>]
     * [<type: barometer><length: 3><byte2><byte1><byte0>]
     * [<type: temperature><length: 2><byte-high><byte-low>]
     * 
     */
    for (var index = 0; index < bytes.length; ) {
      var type = bytes[index++];
    //   var length = bytes[index++];
      var value;
      //console.log("type: " + type + " length: " );
    
      switch (type) {
      case EVB_TYPE.lux:
        if (typeof(evb_sensors.light) == "undefined") {
          evb_sensors.light = {};
        }
    
        value = bytes[index++] << 8;
        value |= bytes[index++];
        value = value * 0.24;
    
        evb_sensors.light.lux = value;
        break;
      case EVB_TYPE.barometer:
        if (typeof(evb_sensors.barometer) == "undefined") {
          evb_sensors.barometer = {};
        }
    
        value = bytes[index++] << 16;
        value |= bytes[index++] << 8;
        value |= bytes[index++];
        value = value * 0.00025;
    
        evb_sensors.barometer.pa = value;
        break;
      case EVB_TYPE.temperature:
        if (typeof(evb_sensors.temperature) == "undefined") {
        evb_sensors.temperature = {};
          }
    
        value = (bytes[index++] << 24) >> 16;
        value |= bytes[index++];
        value = value * 0.0625;
    
        evb_sensors.temperature.c = value;
        evb_sensors.temperature.f =  value * 9 / 5 + 32; 
          
          break;
      case EVB_TYPE.accelerometer:
        if (typeof(evb_sensors.accelerometer) == "undefined") {
        evb_sensors.accelerometer = {};
          }
          // evb_sensors.accelerometer.x = (bytes[index++] << 24) >> 16;
          var x1 = evb_sensors.accelerometer.x = bytes[index++] ;
          // x1 = ~x1 ; 
          // x1 = ( x1 + 1 ) % 256; 
          evb_sensors.accelerometer.x = x1 * 0.0625//; / 15;
          // evb_sensors.accelerometer.y = (bytes[index++] << 24) >> 16;
          var y1 = evb_sensors.accelerometer.y = bytes[index++] ;
          // y1 = ~ y1 ; 
          // y1 = ( y1 + 1 ) % 256;
            
          var y1 = evb_sensors.accelerometer.y = y1 * 0.0625 ; // / 15 ;
    
            // evb_sensors.accelerometer.z = (bytes[index++] << 24) >> 16;
          var z1 = evb_sensors.accelerometer.z = bytes[index++] ;
          // z1 = ~ z1 ; 
          // z1 = ( z1 + 1 ) % 256; 
          // z1 = z1 - 128;
          var z1 = evb_sensors.accelerometer.z = z1 * 0.0625; // / 15;
          break;      
          }
      }
      return {
        temp_c: evb_sensors.temperature.c,
        temp_f: evb_sensors.temperature.f,
        moisture: evb_sensors.barometer.pa,
        lux: evb_sensors.light.lux,
        x_acc: evb_sensors.accelerometer.x,
        y_acc: evb_sensors.accelerometer.y,
        z_acc: evb_sensors.accelerometer.z
      }
    }

   let parsedData = JSON.parse(event.payload);
   
   var data_decode = Buffer.from(parsedData.data, 'base64');
   let resultData = toDecode(data_decode);
   var date = new Date(parsedData.time);
   var epoch = date.getTime();
   
  // console.log(resultData);

  const tableName = "iot-test"; 
    try {
      await dynamodb.putItem({
          "TableName": tableName,
          "Item" : {
              "id":{ S: context.awsRequestId},
              "temp_c": { S: resultData.temp_c.toString()},
              "temp_f": { S: resultData.temp_f.toString()},
              "moisture": { S: resultData.moisture.toString()},
              "lux": { S: resultData.lux.toString()},
              "x_acc": { S: resultData.x_acc.toString()},
              "y_acc": { S: resultData.y_acc.toString()},
              "z_acc": { S: resultData.z_acc.toString()},
              "time" : { N : epoch.toString()},
              "device" : {S: parsedData.deveui.toString()}
          }
      }).promise();
    } catch (error) {
      throw new Error(`Error in dynamoDB: ${JSON.stringify(error)}`);
    }  
   
};
