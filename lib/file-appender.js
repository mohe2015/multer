import objectAssign from 'object-assign'

function arrayRemove (arr, item) {
  const idx = arr.indexOf(item)
  if (~idx) arr.splice(idx, 1)
}

class FileAppender {
  constructor (strategy, req) {
    this.strategy = strategy
    this.req = req

    switch (strategy) {
      case 'NONE': break
      case 'VALUE': break
      case 'ARRAY': req.files = []; break
      case 'OBJECT': req.files = Object.create(null); break
      default: throw new Error('Unknown file strategy: ' + strategy)
    }
  }

  insertPlaceholder (file) {
    const placeholder = {
      fieldname: file.fieldname
    }

    switch (this.strategy) {
      case 'NONE': break
      case 'VALUE': break
      case 'ARRAY': this.req.files.push(placeholder); break
      case 'OBJECT':
        if (this.req.files[file.fieldname]) {
          this.req.files[file.fieldname].push(placeholder)
        } else {
          this.req.files[file.fieldname] = [placeholder]
        }
        break
    }

    return placeholder
  }

  removePlaceholder (placeholder) {
    switch (this.strategy) {
      case 'NONE': break
      case 'VALUE': break
      case 'ARRAY': arrayRemove(this.req.files, placeholder); break
      case 'OBJECT':
        if (this.req.files[placeholder.fieldname].length === 1) {
          delete this.req.files[placeholder.fieldname]
        } else {
          arrayRemove(this.req.files[placeholder.fieldname], placeholder)
        }
        break
    }
  }

  replacePlaceholder (placeholder, file) {
    if (this.strategy === 'VALUE') {
      this.req.file = file
      return
    }

    delete placeholder.fieldname
    objectAssign(placeholder, file)
  }
}

export default FileAppender
