<script>
  import MdHelpOutline from 'svelte-icons/md/MdHelpOutline.svelte'
  import MdCloudUpload from 'svelte-icons/md/MdCloudUpload.svelte'
  import MdCloudDownload from 'svelte-icons/md/MdCloudDownload.svelte'
  import MdRotateLeft from 'svelte-icons/md/MdRotateLeft.svelte'
  import MdRotateRight from 'svelte-icons/md/MdRotateRight.svelte'
  import MdMenu from 'svelte-icons/md/MdMenu.svelte'
</script>

<div class="drawer">
  <input id="my-drawer" type="checkbox" class="drawer-toggle" />
  <div class="drawer-content">
    <!-- Page content here -->
    <div class="navbar min-h-16 bg-[#47606e] text-base-100">
      <div class="flex-1 px-2 lg:flex-none">
        <label for="my-drawer" class="btn btn-primary drawer-button">Open drawer</label>
      </div>

      <div class="flex justify-end flex-1 px-2">
        <div class="flex items-stretch">
          <div class="icon max-h-8">
            <MdRotateLeft />
          </div>
          <div class="icon max-h-8">
            <MdRotateRight />
          </div>
          <div class="icon max-h-8">
            <MdCloudDownload />
          </div>
          <div class="icon max-h-8">
            <MdCloudUpload />
          </div>
          <div class="icon max-h-8">
            <MdHelpOutline />
          </div>
        </div>
      </div>
    </div>

    <div class="btm-nav">
      <div class="flex-1 px-2 lg:flex-none">
        <div class="dropdown dropdown-top">
          <label tabindex="0" class="btn m-1">Movement</label>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
            <li><a>Talk</a></li>
            <li><a>Video</a></li>
            <li><a>Animate</a></li>
            <li><a>Select</a></li>
            <li><a>Floor Plan</a></li>
            <li><a>Codes</a></li>
            <li><a>Export</a></li>
          </ul>
        </div>
      </div>

      <div class="flex justify-end flex-1 px-2">
        <div class="flex items-stretch">
          <div class="icon max-h-8">
            <MdRotateLeft />
          </div>
          <div class="icon max-h-8">
            <MdRotateRight />
          </div>
          <div class="icon max-h-8">
            <MdCloudDownload />
          </div>
          <div class="icon max-h-8">
            <MdCloudUpload />
          </div>
          <div class="icon max-h-8">
            <MdHelpOutline />
          </div>
        </div>
      </div>
    </div>

    <slot />
  </div>
  <div class="drawer-side">
    <label for="my-drawer" class="drawer-overlay"></label>
    <ul class="menu p-4 w-80 bg-base-100 text-base-content">
      <!-- Sidebar content here -->
      <li>Movement</li>
      <li>Talk</li>
      <li>Video</li>
      <li>Select</li>
      <li>Codes</li>
      <li>Export</li>
      <li>2D</li>
      <li>3D</li>
    </ul>
  </div>
</div>
