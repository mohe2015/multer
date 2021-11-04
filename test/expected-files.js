/* eslint-env mocha */

import { strictEqual, ifError } from 'assert'

import { file, submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

describe('Expected files', function () {
  let upload

  before(function (done) {
    upload = multer()
    done()
  })

  it('should reject single unexpected file', function (done) {
    const form = new FormData()
    const parser = upload.single('butme')

    form.append('notme', file('small0.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(err.field, 'notme')
      done()
    })
  })

  it('should reject array of multiple files', function (done) {
    const form = new FormData()
    const parser = upload.array('butme', 4)

    form.append('notme', file('small0.dat'))
    form.append('notme', file('small1.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(err.field, 'notme')
      done()
    })
  })

  it('should reject overflowing arrays', function (done) {
    const form = new FormData()
    const parser = upload.array('butme', 1)

    form.append('butme', file('small0.dat'))
    form.append('butme', file('small1.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(err.field, 'butme')
      done()
    })
  })

  it('should accept files with expected fieldname', function (done) {
    const form = new FormData()
    const parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', file('small0.dat'))
    form.append('butme', file('small1.dat'))
    form.append('andme', file('empty.dat'))

    submitForm(parser, form, function (err, req) {
      ifError(err)

      strictEqual(req.files.butme.length, 2)
      strictEqual(req.files.andme.length, 1)

      done()
    })
  })

  it('should reject files with unexpected fieldname', function (done) {
    const form = new FormData()
    const parser = upload.fields([
      { name: 'butme', maxCount: 2 },
      { name: 'andme', maxCount: 2 }
    ])

    form.append('butme', file('small0.dat'))
    form.append('butme', file('small1.dat'))
    form.append('andme', file('empty.dat'))
    form.append('notme', file('empty.dat'))

    submitForm(parser, form, function (err, req) {
      strictEqual(err.code, 'LIMIT_UNEXPECTED_FILE')
      strictEqual(err.field, 'notme')
      done()
    })
  })

  it('should allow any file to come thru', function (done) {
    const form = new FormData()
    const parser = upload.any()

    form.append('butme', file('small0.dat'))
    form.append('butme', file('small1.dat'))
    form.append('andme', file('empty.dat'))

    submitForm(parser, form, function (err, req) {
      ifError(err)
      strictEqual(req.files.length, 3)
      strictEqual(req.files[0].fieldname, 'butme')
      strictEqual(req.files[1].fieldname, 'butme')
      strictEqual(req.files[2].fieldname, 'andme')
      done()
    })
  })
})
