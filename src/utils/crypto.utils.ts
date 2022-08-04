import { Certificate } from '@fidm/x509'
import * as forge from 'node-forge'
import * as crypto from 'crypto'
import ECKey from 'ec-key'

export const extractMerchantID = (cert) => {
  try {
    return Certificate.fromPEM(cert)
      .extensions.find((el) => el.oid === '1.2.840.113635.100.6.32')
      .value.toString('utf8')
      .split('@')[1]
  } catch (e) {
    throw new Error('Unable to extract merchant ID from certificate')
  }
}

export const generateSharedSecret = (privatePem, ephemeralPublicKey) => {
  const prv = new ECKey(privatePem, 'pem')
  const publicEc = new ECKey(ephemeralPublicKey, 'spki')
  return prv.computeSecret(publicEc).toString('hex')
}

export const generateSymmetricKey = (merchantId, sharedSecret) => {
  const KDF_ALGORITHM = String.fromCharCode(0x0d) + 'id-aes256-GCM'
  const KDF_PARTY_V = Buffer.from(merchantId, 'hex').toString('binary')
  const KDF_INFO = KDF_ALGORITHM + 'Apple' + KDF_PARTY_V

  const hash = crypto.createHash('sha256')
  hash.update(Buffer.from('000000', 'hex'))
  hash.update(Buffer.from('01', 'hex'))
  hash.update(Buffer.from(sharedSecret, 'hex'))
  hash.update(KDF_INFO, 'binary')

  return hash.digest('hex')
}

export const decryptCiphertext = (symmetricKey, ciphertext) => {
  const SYMMETRIC_KEY = forge.util.createBuffer(
      Buffer.from(symmetricKey, 'hex').toString('binary'),
    ),
    IV = forge.util.createBuffer(
      Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]).toString(
        'binary',
      ),
    ),
    CIPHERTEXT = forge.util.createBuffer(forge.util.decode64(ciphertext))

  const decipher = forge.cipher.createDecipher('AES-GCM', SYMMETRIC_KEY)
  decipher.start({
    iv: IV,
    tagLength: 0,
    tag: forge.util.decode64(''),
  })
  decipher.update(CIPHERTEXT)
  decipher.finish()
  return Buffer.from(decipher.output.toHex(), 'hex').toString('utf8')
}
