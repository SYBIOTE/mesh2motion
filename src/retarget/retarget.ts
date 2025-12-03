import { Mesh2MotionEngine } from '../Mesh2MotionEngine.ts'
import { Vector3 } from 'three'

class RetargetModule {
  private mesh2motion_engine: Mesh2MotionEngine
  private fileInput: HTMLInputElement | null = null

  constructor () {
    // Set up camera position similar to marketing bootstrap
    this.mesh2motion_engine = new Mesh2MotionEngine()
    const camera_position = new Vector3().set(0, 1.7, 5)
    this.mesh2motion_engine.set_camera_position(camera_position)
  }

  public add_event_listeners (): void {
    // Get DOM elements
    this.fileInput = document.getElementById('upload-file') as HTMLInputElement

    // Add event listener for file selection
    this.fileInput.addEventListener('change', (event) => {
      console.log('File input changed', event)
      this.handleFileSelect(event)
    })
  }

  private handleFileSelect (event: Event): void {
    const target = event.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const file = target.files[0]
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type)

      // Get file extension
      const file_name = file.name.toLowerCase()
      let file_extension = ''
      if (file_name.endsWith('.glb')) {
        file_extension = 'glb'
      } else if (file_name.endsWith('.fbx')) {
        file_extension = 'fbx'
      } else if (file_name.endsWith('.zip')) {
        file_extension = 'zip'
      } else {
        console.error('Unsupported file type')
        this.showErrorDialog('Unsupported file type. Please select a GLB, FBX, or ZIP file.')
        return
      }

      // Configure the model loader to preserve all objects (bones, etc.)
      this.mesh2motion_engine.load_model_step.set_preserve_all_objects(true)

      // Create a URL for the file and load it
      const file_url = URL.createObjectURL(file)

      try {
        this.mesh2motion_engine.load_model_step.load_model_file(file_url, file_extension)
        console.log('Model loading initiated...')

        // TODO: Add listener for load completion
        // TODO: Validate that the model contains skeletal data
        // TODO: Show error dialog if no bones found
      } catch (error) {
        console.error('Error loading model:', error)
        this.showErrorDialog('Error loading model file.')
        URL.revokeObjectURL(file_url) // Clean up the URL
      }
    }
  }

  private showErrorDialog (message: string): void {
    // Simple alert for now - could be replaced with a proper modal dialog later
    alert(message)
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  retarget_app.add_event_listeners()
})

const retarget_app = new RetargetModule()
