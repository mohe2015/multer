/* eslint-env mocha */

import { strictEqual, ifError } from 'assert'

import { file as _file, submitForm } from './_util.js'
import multer from '../index.js'
import FormData from 'form-data'

function generateForm () {
  const form = new FormData()

  form.append('CA$|-|', _file('empty.dat'))
  form.append('set-1', _file('tiny0.dat'))
  form.append('set-1', _file('empty.dat'))
  form.append('set-1', _file('tiny1.dat'))
  form.append('set-2', _file('tiny1.dat'))
  form.append('set-2', _file('tiny0.dat'))
  form.append('set-2', _file('empty.dat'))

  return form
}

function assertSet (files, setName, fileNames) {
  const len = fileNames.length

  strictEqual(files.length, len)

  for (let i = 0; i < len; i++) {
    strictEqual(files[i].fieldname, setName)
    strictEqual(files[i].originalname, fileNames[i])
  }
}

describe('Select Field', function () {
  let parser

  before(function () {
    parser = multer().fields([
      { name: 'CA$|-|', maxCount: 1 },
      { name: 'set-1', maxCount: 3 },
      { name: 'set-2', maxCount: 3 }
    ])
  })

  it('should select the first file with fieldname', function (done) {
    submitForm(parser, generateForm(), function (err, req) {
      ifError(err)

      let file

      file = req.files['CA$|-|'][0]
      strictEqual(file.fieldname, 'CA$|-|')
      strictEqual(file.originalname, 'empty.dat')

      file = req.files['set-1'][0]
      strictEqual(file.fieldname, 'set-1')
      strictEqual(file.originalname, 'tiny0.dat')

      file = req.files['set-2'][0]
      strictEqual(file.fieldname, 'set-2')
      strictEqual(file.originalname, 'tiny1.dat')

      done()
    })
  })

  it('should select all files with fieldname', function (done) {
    submitForm(parser, generateForm(), function (err, req) {
      ifError(err)

      assertSet(req.files['CA$|-|'], 'CA$|-|', ['empty.dat'])
      assertSet(req.files['set-1'], 'set-1', ['tiny0.dat', 'empty.dat', 'tiny1.dat'])
      assertSet(req.files['set-2'], 'set-2', ['tiny1.dat', 'tiny0.dat', 'empty.dat'])

      done()
    })
  })
})
