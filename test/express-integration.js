/* eslint-env mocha */

import { strictEqual, ifError } from 'assert'

import multer from '../index.js'
import { file as _file } from './_util.js'

import express, { Router } from 'express'
import FormData from 'form-data'
import concat from 'concat-stream'
import onFinished from 'on-finished'

const port = 34279

describe('Express Integration', function () {
  let app

  before(function (done) {
    app = express()
    app.listen(port, done)
  })

  function submitForm (form, path, cb) {
    const req = form.submit('http://localhost:' + port + path)

    req.on('error', cb)
    req.on('response', function (res) {
      res.on('error', cb)
      res.pipe(concat({ encoding: 'buffer' }, function (body) {
        onFinished(req, function () { cb(null, res, body) })
      }))
    })
  }

  it('should work with express error handling', function (done) {
    const limits = { fileSize: 200 }
    const upload = multer({ limits: limits })
    const router = new Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', _file('large.jpg'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      strictEqual(err.code, 'LIMIT_FILE_SIZE')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t1', router)
    submitForm(form, '/t1/profile', function (err, res, body) {
      ifError(err)

      strictEqual(routeCalled, 0)
      strictEqual(errorCalled, 1)
      strictEqual(body.toString(), 'ERROR')
      strictEqual(res.statusCode, 500)

      done()
    })
  })

  it('should work when receiving error from fileFilter', function (done) {
    function fileFilter (req, file, cb) {
      cb(new Error('TEST'))
    }

    const upload = multer({ fileFilter: fileFilter })
    const router = new Router()
    const form = new FormData()

    let routeCalled = 0
    let errorCalled = 0

    form.append('avatar', _file('large.jpg'))

    router.post('/profile', upload.single('avatar'), function (req, res, next) {
      routeCalled++
      res.status(200).end('SUCCESS')
    })

    router.use(function (err, req, res, next) {
      strictEqual(err.message, 'TEST')

      errorCalled++
      res.status(500).end('ERROR')
    })

    app.use('/t2', router)
    submitForm(form, '/t2/profile', function (err, res, body) {
      ifError(err)

      strictEqual(routeCalled, 0)
      strictEqual(errorCalled, 1)
      strictEqual(body.toString(), 'ERROR')
      strictEqual(res.statusCode, 500)

      done()
    })
  })
})
