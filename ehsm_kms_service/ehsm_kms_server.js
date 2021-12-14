const express = require('express')
const ffi = require('ffi-napi');
const crypto = require('crypto')
const app = express();
const logger = require('./logs/logger');
const { ehsm_kms_params, ehsm_keyspec_t, ehsm_keyorigin_t} = require('./ehsm_kms_params.js')

app.use(express.json());

const port = 3000;

const result = (code, msg, data={}) => {
  return {
    code: code,
    message: msg,
    result: {
      ...data
    }
  }
}

const apis= {
  CreateKey: 'CreateKey',
  Encrypt: 'Encrypt',
  Decrypt: 'Decrypt',
  GenerateDataKey: 'GenerateDataKey',
  GenerateDataKeyWithoutPlaintext: 'GenerateDataKeyWithoutPlaintext',
  ExportDataKey: 'ExportDataKey',
  Sign: 'Sign',
  Verify: 'Verify',
}

// base64 encode
const base64_encode = (str) => new Buffer.from(str).toString('base64');
// base64 decode
const base64_decode =(base64_str) =>new Buffer.from(base64_str, 'base64').toString();

/**
 * check sign
 */
const _checkSign = function (req,res,next){
  const _logData = {
    body: req.body,
    query: req.query
  }
  logger.info(JSON.stringify(_logData));
  const {appid,nonce,timestamp,sign, payload} = req.body;
  if(!appid || !nonce|| !timestamp  || !sign || !payload) {
    res.send(result(400,'Missing required parameters'));
    return;
  }
  let test_app_key = '202112345678';

  let str = '';
  let sign_parmas = {appid, nonce, timestamp} 
  for(var k in sign_parmas){
    if(!str) {
      str += k + '=' + sign_parmas[k]
    } else{
      str += '&' + k + '=' + sign_parmas[k]
    }
  }
  str += '&app_key=' + test_app_key;
  let local_sign = crypto.createHmac('sha256',test_app_key).update(str, 'utf8').digest('base64');
  if(sign != local_sign) {
    res.send(result(400,'sign error'));
    return;
  }

  next();
}
/**
 * check payload
 */
 const _checkPayload = function (req,res,next){
   const action = req.query.Action;
  const { payload } = req.body;
  const currentPayLoad = ehsm_kms_params[action];
  for (const key in currentPayLoad) {
    if (payload[key] == undefined) {
      res.send(result(400, 'The payload parameter is incomplete'));
      return;
    }
  }
  next();
}
/**
 * sign 
 */

app.use(_checkSign);
/**
 * payload 
 */
app.use(_checkPayload);

/**
 * ehsm_napi function object
 */ 
const ehsm_napi = ffi.Library('./libehsmnapi',{
  /**
    NAPI_CreateKey
    Description:
    Create a customer master key with the following metadatas
    .keyspec;
        -EH_AES_GCM_128,
        -EH_AES_GCM_256,
        -EH_RSA_2048,
        -EH_RSA_3072,
        -EH_EC_P256,
        -EH_EC_P512,
        -EH_EC_SM2,
        -EH_SM4,
    .origin;
        -EH_INTERNAL_KEY (generated from the eHSM inside)
        -EXTERNAL_KEY (generated by the customer and want to import into the eHSM),
    .purpose;
        -ENCRYPT_DECRYPT,
        -SIGN_VERIFY,
    .apiversion;
        -Reserved
    .descrption;
        -Reserved
    .createdate
        -Reserved
    Note: the CMK will be wrapped by the DK(DomainKey)

    params 
     - keyspec: int
     - origin: int
    
    return json
     {
       code: int,
       message: string,
       result: {
         cmk_base64 : string,
       }
    }
   */
  'NAPI_CreateKey': ['string',['int','int']],
  /**
    NAPI_Encrypt 
    Description:
     Encrypt an arbitrary set of bytes using the CMK.(only support symmetric types)

    params
     - cmk_base64: string
     - plaintext: string
     - aad: string
    
    return json
     {
       code: int,
       message: string,
       result: {
         cipherText_base64 : string,
       }
    }
   */
  'NAPI_Encrypt': ['string',['string','string', 'string']],
  
  /**
    NAPI_Decrypt 
    Description:
      Decrypts ciphertext using the CMK.(only support symmetric types)

    params
     - cmk_base64: string
     - ciphertext: string
     - aad: string
    
    return json
     {
       code: int,
       message: string,
       result: {
         plaintext_base64 : string,
       }
    }
   */
  'NAPI_Decrypt': ['string',['string','string', 'string']],
  /**
    NAPI_GenerateDataKey 
    Description:
    Generates a random data key that is used to locally encrypt data.
    the datakey will be wrapped by the specified CMK(only support asymmetric keyspec),
    and it will return the plaintext and ciphertext of the data key.
    You can use the plaintext of the data key to locally encrypt your data without using KMS
    and store the encrypted data together with the ciphertext of the data key, then clear the
    plaintext data from memory as soon as possible.
    when you want to obtain the plaintext of datakey again, you can call the Decrypt with the
    cmk to get the plaintext data.

    params 
     - cmk_base64: string
     - keylen： number
     - aad: string
     
    return json
     {
       code: int,
       message: string,
       result: {
         plaintext_base64 : string,
         cipherText_base64 : string,
       }
    }
   */
  'NAPI_GenerateDataKey': ['string',['string', 'int', 'string']],

  /*
  create the enclave
  */

  'NAPI_Initialize':['string',[]],
  
  /*
  destory the enclave
  */
  'NAPI_Finalize':['string', []],

  /*
    NAPI_GenerateDataKeyWithoutPlaintext
    Description:
    The same as GenerateDataKey, but doesn’t return plaintext of generated DataKey.

    params 
     - cmk_base64: string
     - keylen： number
     - aad: string
     
    return json
     {
       code: int,
       message: string,
       result: {
         ciphertext_base64 : string,
       }
    }

  */
  'NAPI_GenerateDataKeyWithoutPlaintext': ['string', ['string', 'int', 'string']],

  /*
    Description:
    Performs sign operation using the cmk(only support asymmetric keyspec).

    params:
     - cmk_base64: string
     - digest: string

    return json
     {
       code: int,
       message: string,
       result: {
         signature_base64: string
       }
    }
  */
  'NAPI_Sign':['string', ['string', 'string']],

  /*
    Description:
    Performs verify operation using the cmk(only support asymmetric keyspec).

    params:
     - cmk_base64: string
     - digest string
     - signature: string

    return json
     {
       code: int,
       message: string,
       result: {
         result: bool
       }
    }
  */
  'NAPI_Verify':['string', ['string', 'string', 'string']],
});

const NAPI_Initialize = ehsm_napi.NAPI_Initialize();

if(JSON.parse(NAPI_Initialize)['code'] != 200) {
  console.log('service Initialize exception!')
	process.exit(0);
}



/**
 * ehsm napi result
 * @param {function name} action 
 * @param {} res 
 * @param {NAPI_* function params} params 
 * @returns 
 */

const napi_result = (action, res, params) => {
  try {
    // r : NAPI_(*) Return results
    const r = JSON.parse(ehsm_napi[`NAPI_${action}`](...params));
    res.send(r);
  } catch (e) {
    res.send(result(400, e))
  }
  return;
}

/**
 * router
 */
app.post('/ehsm', function (req, res) {
  const PAYLOAD = req.body.payload;
  
  // ACTION: request function name
  const ACTION = req.query.Action;
  
  if(ACTION === apis.CreateKey) {
  /**
   * CreateKey
   */
    let { keyspec, origin } = PAYLOAD;
    keyspec = ehsm_keyspec_t[keyspec];
    origin = ehsm_keyorigin_t[origin]
    napi_result(ACTION ,res, [keyspec, origin]);
  } else if(ACTION === apis.Encrypt) {
  /**
   * Encrypt
   */
    const { cmk_base64, plaintext, aad } = PAYLOAD;
    napi_result(ACTION ,res, [cmk_base64, plaintext, aad]);
  } else if(ACTION === apis.Decrypt) {
  /**
   * Decrypt
   */
    const { cmk_base64, ciphertext, aad } = PAYLOAD;
    napi_result(ACTION ,res, [cmk_base64, ciphertext, aad]);
  } else if(ACTION === apis.GenerateDataKey) {
  /**
   * GenerateDataKey
   */
    const { cmk_base64, keylen, aad } = PAYLOAD;
    napi_result(ACTION ,res, [cmk_base64, keylen, aad]);
  } else if(ACTION === apis.GenerateDataKeyWithoutPlaintext) {
  /**
   * GenerateDataKeyWithoutPlaintext
   */
    const { cmk_base64, keylen, aad } = PAYLOAD;
    napi_result(ACTION ,res, [cmk_base64, keylen, aad]);
  } else if(ACTION === apis.Sign) {
    /**
     * Sign
     */
      const { cmk_base64, digest } = PAYLOAD;
      napi_result(ACTION ,res, [cmk_base64, digest]);
  } else if(ACTION === apis.Verify) {
    /**
     * Verify
     */
      const { cmk_base64, digest, signature_base64 } = PAYLOAD;
      napi_result(ACTION ,res, [cmk_base64, digest, signature_base64]);
  }else {
    res.send(result(404, 'Not Fount', {}));
  }
})
process.on('SIGINT', function() {
  console.log('ehsm kms service exit')
  ehsm_napi.NAPI_Finalize();
	process.exit(0);
});

const  getIPAdress = () => {
  var interfaces = require('os').networkInterfaces();　　
  for (var devName in interfaces) {　　　　
      var iface = interfaces[devName];　　　　　　
      for (var i = 0; i < iface.length; i++) {
          var alias = iface[i];
          if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
              return alias.address;
          }
      }　　
  }
}

app.listen(port, () => {
  console.log(`ehsm_ksm_service application listening at ${getIPAdress()}:${port}`)
})

