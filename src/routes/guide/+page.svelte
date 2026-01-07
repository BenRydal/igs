<script lang="ts">
  import MdFloorPlan from '~icons/mdi/floor-plan'
  import MdMapMarkerPath from '~icons/mdi/map-marker-path'
  import MdChat from '~icons/mdi/chat-outline'
  import MdVideo from '~icons/mdi/video-outline'
  import MdTag from '~icons/mdi/tag-outline'
  import MdClock from '~icons/mdi/clock-outline'

  const faqItems = [
    {
      question: 'How do I save a spreadsheet as CSV?',
      answer:
        'In Excel or Google Sheets, go to <strong>File → Download → CSV</strong> (or Save As → CSV).',
    },
    {
      question: "My movement doesn't line up with my floor plan",
      answer:
        "Make sure you're using the exact same floor plan image that was used when recording the x,y positions. The coordinates are pixel positions on that specific image.",
    },
    {
      question: 'How do I track multiple people?',
      answer:
        "Create a separate movement file for each person. Name each file with the person's name (e.g., <code>Alice.csv</code>, <code>Bob.csv</code>). Import all files together.",
    },
    {
      question: 'My GPS data looks wrong or has gaps',
      answer:
        'IGS automatically filters out GPS errors (like impossible speeds). If you see gaps, it might be due to poor GPS signal during recording. Large gaps will trigger a warning.',
    },
    {
      question: "What's the difference between x,y and lat,lng?",
      answer:
        "<strong>x,y</strong> are pixel coordinates on your floor plan image (for indoor tracking).<br><br><strong>lat,lng</strong> are GPS coordinates (for outdoor tracking). IGS detects which type you're using based on the column names.",
    },
  ]
</script>

<svelte:head>
  <title>Data Format Guide | IGS</title>
</svelte:head>

<div class="min-h-screen bg-base-100">
  <!-- Header -->
  <header class="sticky top-0 z-10 bg-base-100 border-b border-base-300 px-4 py-3">
    <div class="max-w-3xl mx-auto flex items-center gap-4">
      <a href="/" class="btn btn-ghost btn-sm gap-2">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to IGS
      </a>
    </div>
  </header>

  <!-- Content -->
  <main class="max-w-3xl mx-auto px-4 py-8">
    <!-- Hero -->
    <div class="text-center mb-12">
      <h1 class="text-3xl font-bold mb-3">How to Use Your Own Data</h1>
      <p class="text-lg text-base-content/70">
        IGS visualizes how people move and talk over time. Here's how to bring in your own data.
      </p>
    </div>

    <!-- What do you want to visualize? -->
    <section class="mb-12">
      <h2 class="text-xl font-bold mb-4">What do you want to visualize?</h2>

      <div class="grid gap-4 sm:grid-cols-2">
        <!-- Indoor -->
        <a href="#indoor" class="card bg-base-200 hover:bg-base-300 transition-colors">
          <div class="card-body">
            <div class="w-12 h-12 rounded-full bg-info/10 flex items-center justify-center mb-3">
              <MdFloorPlan class="text-2xl text-info" />
            </div>
            <h3 class="card-title text-lg">Indoor Movement</h3>
            <p class="text-sm text-base-content/70 mb-2">
              Classrooms, museums, offices, or any indoor space
            </p>
            <p class="text-sm text-base-content/70 italic">
              Data from sensor tracking systems or manually created with <span
                class="font-bold underline">Mondrian Transcription</span
              >
            </p>
          </div>
        </a>

        <!-- Outdoor -->
        <a href="#outdoor" class="card bg-base-200 hover:bg-base-300 transition-colors">
          <div class="card-body">
            <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <MdMapMarkerPath class="text-2xl text-success" />
            </div>
            <h3 class="card-title text-lg">Outdoor / GPS Movement</h3>
            <p class="text-sm text-base-content/70 mb-2">
              Walking tours, hikes, runs, or any outdoor activity
            </p>
            <p class="text-sm text-base-content/70 italic">
              Data from fitness apps, GPS watches, or phone tracking
            </p>
          </div>
        </a>
      </div>
    </section>

    <!-- The Basics -->
    <section class="mb-12">
      <h2 class="text-xl font-bold mb-4">The Basics</h2>

      <div class="space-y-4 text-base-content/80">
        <p>
          <strong>IGS needs two things to create a visualization:</strong>
        </p>
        <ol class="list-decimal list-inside space-y-2 ml-2">
          <li>
            A <strong>background image</strong> (your floor plan, or IGS fetches a map automatically for
            GPS data)
          </li>
          <li>
            A <strong>movement file</strong> that says where someone was at each point in time
          </li>
        </ol>
        <p>
          You can also add <strong>conversation transcripts</strong>, <strong>video</strong>, and
          <strong>codes</strong> to enrich your visualization, but these are optional.
        </p>
      </div>
    </section>

    <!-- Indoor Movement -->
    <section id="indoor" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
          <MdFloorPlan class="text-xl text-info" />
        </div>
        <h2 class="text-xl font-bold">Indoor Movement</h2>
      </div>

      <div class="space-y-6">
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold text-lg">Step 1: Prepare your floor plan</h3>
            <p class="text-base-content/70">
              You need an image of your space (PNG or JPG). This could be:
            </p>
            <ul class="list-disc list-inside text-base-content/70 mt-2 space-y-1">
              <li>A hand-drawn sketch photographed with your phone</li>
              <li>An architectural floor plan</li>
              <li>A screenshot from Google Maps (indoor view)</li>
              <li>Any bird's-eye view image of your space</li>
            </ul>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold text-lg">Step 2: Create your movement file</h3>
            <p class="text-base-content/70 mb-3">
              A movement file is a simple spreadsheet (saved as CSV) that records where someone was
              at each moment. Each row has three pieces of information:
            </p>

            <div class="overflow-x-auto bg-base-100 rounded-lg">
              <table class="table table-sm">
                <thead>
                  <tr class="text-left">
                    <th>time</th>
                    <th>x</th>
                    <th>y</th>
                  </tr>
                </thead>
                <tbody class="text-base-content/70">
                  <tr><td>0</td><td>337</td><td>371</td></tr>
                  <tr><td>1</td><td>340</td><td>368</td></tr>
                  <tr><td>2</td><td>345</td><td>362</td></tr>
                  <tr><td>3</td><td>352</td><td>355</td></tr>
                </tbody>
              </table>
            </div>

            <div class="mt-4 space-y-2 text-sm text-base-content/60">
              <p><strong>time</strong> — When (in seconds, or see "Time Formats" below)</p>
              <p>
                <strong>x</strong> — How far from the left edge of your floor plan image (in pixels)
              </p>
              <p>
                <strong>y</strong> — How far from the top edge of your floor plan image (in pixels)
              </p>
            </div>

            <div class="alert alert-info mt-4">
              <div>
                <p class="font-medium">How do I get x,y coordinates?</p>
                <p class="text-sm mt-1">
                  If you don't have tracking software, you can use
                  <a
                    href="https://github.com/BenRydal/mondrian"
                    target="_blank"
                    class="link font-bold underline">Mondrian Transcription</a
                  > — a free tool that lets you click on your floor plan to record positions while watching
                  video.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold text-lg">Step 3: Name your files</h3>
            <p class="text-base-content/70">
              The name of your movement file becomes the person's label in IGS.
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <code class="badge badge-lg">Teacher.csv</code>
              <span class="text-base-content/50">→</span>
              <span class="badge badge-lg badge-primary">Teacher</span>
            </div>
            <p class="text-sm text-base-content/60 mt-3">
              To track multiple people, create separate files for each person (e.g., <code
                >Student1.csv</code
              >, <code>Student2.csv</code>).
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Outdoor / GPS -->
    <section id="outdoor" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
          <MdMapMarkerPath class="text-xl text-success" />
        </div>
        <h2 class="text-xl font-bold">Outdoor / GPS Movement</h2>
      </div>

      <p class="text-base-content/70 mb-6">
        For outdoor activities, IGS automatically fetches a map — no floor plan needed!
      </p>

      <div class="space-y-6">
        <!-- GPX Option -->
        <div class="card bg-base-200">
          <div class="card-body">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-semibold text-lg">Option A: Export from your fitness app</h3>
              <span class="badge badge-success badge-sm">Easiest</span>
            </div>
            <p class="text-base-content/70 mb-3">
              Most fitness apps let you export activities as GPX files. IGS reads these directly.
            </p>
            <div class="flex flex-wrap gap-2">
              <span class="badge badge-outline">Strava</span>
              <span class="badge badge-outline">Garmin</span>
              <span class="badge badge-outline">AllTrails</span>
              <span class="badge badge-outline">Apple Fitness</span>
              <span class="badge badge-outline">Google Maps Timeline</span>
            </div>
            <p class="text-sm text-base-content/60 mt-3">
              Look for "Export GPX" or "Download GPX" in your app's activity details.
            </p>
          </div>
        </div>

        <!-- CSV Option -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold text-lg mb-2">Option B: Create a GPS spreadsheet</h3>
            <p class="text-base-content/70 mb-3">
              If you have GPS coordinates in a spreadsheet, save it as CSV with these columns:
            </p>

            <div class="overflow-x-auto bg-base-100 rounded-lg">
              <table class="table table-sm">
                <thead>
                  <tr class="text-left">
                    <th>time</th>
                    <th>lat</th>
                    <th>lng</th>
                  </tr>
                </thead>
                <tbody class="text-base-content/70">
                  <tr><td>0</td><td>40.7128</td><td>-74.0060</td></tr>
                  <tr><td>5</td><td>40.7129</td><td>-74.0058</td></tr>
                  <tr><td>10</td><td>40.7131</td><td>-74.0055</td></tr>
                </tbody>
              </table>
            </div>

            <p class="text-sm text-base-content/60 mt-3">
              Use decimal coordinates (like <code>40.7128</code>), not degrees-minutes-seconds.
            </p>
          </div>
        </div>

        <!-- Map styles -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold text-lg mb-2">Changing the map style</h3>
            <p class="text-base-content/70 mb-3">
              After loading GPS data, click the <strong>Map</strong> dropdown to switch between styles:
            </p>
            <div class="flex flex-wrap gap-2">
              <span class="badge">Streets</span>
              <span class="badge">Outdoors</span>
              <span class="badge">Satellite</span>
              <span class="badge">Light</span>
              <span class="badge">Dark</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Optional: Conversation -->
    <section id="conversation" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
          <MdChat class="text-xl text-info" />
        </div>
        <h2 class="text-xl font-bold">Adding Conversation</h2>
        <span class="badge badge-ghost">Optional</span>
      </div>

      <p class="text-base-content/70 mb-4">
        If you have a transcript, you can overlay speech bubbles on your visualization.
      </p>

      <div class="card bg-base-200">
        <div class="card-body">
          <p class="text-base-content/70 mb-3">Create a CSV file with three columns:</p>

          <div class="overflow-x-auto bg-base-100 rounded-lg">
            <table class="table table-sm">
              <thead>
                <tr class="text-left">
                  <th>time</th>
                  <th>speaker</th>
                  <th>talk</th>
                </tr>
              </thead>
              <tbody class="text-base-content/70">
                <tr><td>0</td><td>Teacher</td><td>Good morning everyone</td></tr>
                <tr><td>3</td><td>Student1</td><td>Good morning!</td></tr>
                <tr><td>5</td><td>Teacher</td><td>Let's get started</td></tr>
              </tbody>
            </table>
          </div>

          <div class="alert mt-4">
            <div>
              <p class="font-medium">Linking speech to movement paths</p>
              <p class="text-sm mt-1">
                To connect a speaker's words to their movement path, make sure the <strong
                  >speaker</strong
                >
                name matches the <strong>filename</strong> of their movement file.
              </p>
              <p class="text-sm mt-2">
                Example: <code>Teacher</code> in conversation links to <code>Teacher.csv</code> movement
                file.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Optional: Video -->
    <section id="video" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
          <MdVideo class="text-xl text-warning" />
        </div>
        <h2 class="text-xl font-bold">Adding Video</h2>
        <span class="badge badge-ghost">Optional</span>
      </div>

      <p class="text-base-content/70 mb-4">
        Add video to watch alongside your visualization. The video syncs with the timeline.
      </p>

      <div class="card bg-base-200">
        <div class="card-body space-y-2 text-base-content/70">
          <p>• Use <strong>MP4</strong> format for best compatibility</p>
          <p>• The video length should match your data's time range</p>
          <p>• Drag and drop the video file, or use the File menu to import</p>
        </div>
      </div>
    </section>

    <!-- Optional: Codes -->
    <section id="codes" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
          <MdTag class="text-xl text-secondary" />
        </div>
        <h2 class="text-xl font-bold">Adding Codes / Annotations</h2>
        <span class="badge badge-ghost">Optional</span>
      </div>

      <p class="text-base-content/70 mb-4">
        Codes let you highlight time segments in your visualization — useful for marking activities,
        phases, or events.
      </p>

      <div class="space-y-4">
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold mb-2">Simple format (one code type per file)</h3>
            <p class="text-sm text-base-content/60 mb-3">The filename becomes the code label.</p>

            <p class="text-xs text-base-content/50 mb-1">File: <code>Group Work.csv</code></p>
            <div class="overflow-x-auto bg-base-100 rounded-lg">
              <table class="table table-sm">
                <thead>
                  <tr class="text-left"><th>start</th><th>end</th></tr>
                </thead>
                <tbody class="text-base-content/70">
                  <tr><td>120</td><td>300</td></tr>
                  <tr><td>450</td><td>600</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="font-semibold mb-2">Multi-code format (multiple code types in one file)</h3>

            <div class="overflow-x-auto bg-base-100 rounded-lg">
              <table class="table table-sm">
                <thead>
                  <tr class="text-left"><th>code</th><th>start</th><th>end</th></tr>
                </thead>
                <tbody class="text-base-content/70">
                  <tr><td>Lecture</td><td>0</td><td>120</td></tr>
                  <tr><td>Group Work</td><td>120</td><td>300</td></tr>
                  <tr><td>Discussion</td><td>300</td><td>450</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Time Formats -->
    <section id="time" class="mb-12 scroll-mt-20">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center">
          <MdClock class="text-xl text-base-content/70" />
        </div>
        <h2 class="text-xl font-bold">Time Formats</h2>
      </div>

      <p class="text-base-content/70 mb-4">
        IGS is flexible about how you write times. Use whatever format is easiest for you — IGS will
        figure it out.
      </p>

      <div class="card bg-base-200">
        <div class="card-body">
          <p class="font-medium mb-3">All of these work:</p>
          <div class="overflow-x-auto">
            <table class="table table-sm">
              <tbody class="text-base-content/70">
                <tr>
                  <td class="font-medium">Seconds</td>
                  <td><code>0</code>, <code>30</code>, <code>125.5</code></td>
                </tr>
                <tr>
                  <td class="font-medium">Minutes:Seconds</td>
                  <td><code>1:30</code>, <code>5:00</code></td>
                </tr>
                <tr>
                  <td class="font-medium">Hours:Minutes:Seconds</td>
                  <td><code>0:01:30</code>, <code>1:05:00</code></td>
                </tr>
                <tr>
                  <td class="font-medium">Date + Time</td>
                  <td><code>2024-03-15 14:30:00</code></td>
                </tr>
                <tr>
                  <td class="font-medium">ISO format</td>
                  <td><code>2024-03-15T14:30:00Z</code></td>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-sm text-base-content/60 mt-4">
            IGS automatically converts everything to relative time, starting from 0.
          </p>
        </div>
      </div>
    </section>

    <!-- Common Questions -->
    <section id="faq" class="mb-12 scroll-mt-20">
      <h2 class="text-xl font-bold mb-4">Common Questions</h2>

      <div class="space-y-3">
        {#each faqItems as { question, answer }}
          <div class="collapse collapse-arrow bg-base-200">
            <input type="checkbox" />
            <div class="collapse-title font-medium">{question}</div>
            <div class="collapse-content text-base-content/70">
              <p>{@html answer}</p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Need Help -->
    <section class="mb-8 text-center">
      <h2 class="text-xl font-bold mb-4">Need more help?</h2>
      <div class="flex flex-wrap justify-center gap-3">
        <a href="/" class="btn btn-primary">Try an Example</a>
        <a
          href="https://www.youtube.com/watch?v=smoxv9AspHA"
          target="_blank"
          class="btn btn-outline">Watch Demo</a
        >
        <a href="https://forms.gle/M1gvdgSvdH9yXAABA" target="_blank" class="btn btn-outline"
          >Ask a Question</a
        >
      </div>
    </section>
  </main>
</div>
