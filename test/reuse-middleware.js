/* eslint-env mocha */

import { ifError, strictEqual } from 'assert'

import { file as _file, submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

describe('Reuse Middleware', function () {
  let parser

  before(function (done) {
    parser = multer().array('them-files')
    done()
  })

  it('should accept multiple requests', function (done) {
    let pending = 8

    function submitData (fileCount) {
      const form = new FormData()

      form.append('name', 'Multer')
      form.append('files', '' + fileCount)

      for (let i = 0; i < fileCount; i++) {
        form.append('them-files', _file('small0.dat'))
      }

      submitForm(parser, form, function (err, req) {
        ifError(err)

        strictEqual(req.body.name, 'Multer')
        strictEqual(req.body.files, '' + fileCount)
        strictEqual(req.files.length, fileCount)

        req.files.forEach(function (file) {
          strictEqual(file.fieldname, 'them-files')
          strictEqual(file.originalname, 'small0.dat')
          strictEqual(file.size, 1778)
          strictEqual(file.buffer.length, 1778)
        })

        if (--pending === 0) done()
      })
    }

    submitData(9)
    submitData(1)
    submitData(5)
    submitData(7)
    submitData(2)
    submitData(8)
    submitData(3)
    submitData(4)
  })
})
