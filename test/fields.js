/* eslint-env mocha */

import assert, { ifError, strictEqual } from 'assert'
import deepEqual from 'deep-equal'
import { PassThrough } from 'stream'

import { submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

describe('Fields', function () {
  let parser

  before(function () {
    parser = multer().fields([])
  })

  it('should process multiple fields', function (done) {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('key', 'value')
    form.append('abc', 'xyz')

    submitForm(parser, form, function (err, req) {
      ifError(err)
      assert(deepEqual(req.body, {
        name: 'Multer',
        key: 'value',
        abc: 'xyz'
      }))
      done()
    })
  })

  it('should process empty fields', function (done) {
    const form = new FormData()

    form.append('name', 'Multer')
    form.append('key', '')
    form.append('abc', '')
    form.append('checkboxfull', 'cb1')
    form.append('checkboxfull', 'cb2')
    form.append('checkboxhalfempty', 'cb1')
    form.append('checkboxhalfempty', '')
    form.append('checkboxempty', '')
    form.append('checkboxempty', '')

    submitForm(parser, form, function (err, req) {
      ifError(err)
      assert(deepEqual(req.body, {
        name: 'Multer',
        key: '',
        abc: '',
        checkboxfull: ['cb1', 'cb2'],
        checkboxhalfempty: ['cb1', ''],
        checkboxempty: ['', '']
      }))
      done()
    })
  })

  it('should not process non-multipart POST request', function (done) {
    const req = new PassThrough()

    req.end('name=Multer')
    req.method = 'POST'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    parser(req, null, function (err) {
      ifError(err)
      strictEqual(Object.prototype.hasOwnProperty.call(req, 'body'), false)
      strictEqual(Object.prototype.hasOwnProperty.call(req, 'files'), false)
      done()
    })
  })

  it('should not process non-multipart GET request', function (done) {
    const req = new PassThrough()

    req.end('name=Multer')
    req.method = 'GET'
    req.headers = {
      'content-type': 'application/x-www-form-urlencoded',
      'content-length': 11
    }

    parser(req, null, function (err) {
      ifError(err)
      strictEqual(Object.prototype.hasOwnProperty.call(req, 'body'), false)
      strictEqual(Object.prototype.hasOwnProperty.call(req, 'files'), false)
      done()
    })
  })

  /*
  forEachTestData(function (test) {
    it('should handle ' + test.name, function (done) {
      const form = new FormData()

      test.fields.forEach(function (field) {
        form.append(field.key, field.value)
      })

      submitForm(parser, form, function (err, req) {
        ifError(err)
        assert(deepEqual(req.body, test.expected))
        done()
      })
    })
  })
  */

  it('should convert arrays into objects', function (done) {
    const form = new FormData()

    form.append('obj[0]', 'a')
    form.append('obj[2]', 'c')
    form.append('obj[x]', 'yz')

    submitForm(parser, form, function (err, req) {
      ifError(err)
      assert(deepEqual(req.body, {
        obj: {
          0: 'a',
          2: 'c',
          x: 'yz'
        }
      }))
      done()
    })
  })
})
