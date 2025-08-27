import { rimrafSync } from 'rimraf'
import fs from 'fs'
import path from 'path'
import webpackPaths from '../configs/webpack.paths'

// Delete all .map files in the dist directory and its subdirectories
const deleteSourceMaps = (dir) => {
  if (!fs.existsSync(dir)) return

  const files = fs.readdirSync(dir)
  files.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      deleteSourceMaps(filePath)
    } else if (path.extname(file) === '.map') {
      console.log(`Deleting source map: ${filePath}`)
      fs.unlinkSync(filePath)
    }
  })
}

console.log('Deleting source maps...')
deleteSourceMaps(webpackPaths.distPath)
console.log('Source map deletion complete.')
