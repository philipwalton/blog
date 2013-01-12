require 'fileutils'

desc "Load a local server and watch for any changes"
task :preview, :port do |t, args|

  puts "Starting server on port #{args.port || 4000}."
  puts "Starting to watch source with Jekyll and Compass."

  jekyll_pid = Process.spawn("jekyll --auto --server #{args.port}")
  compass_pid = Process.spawn("compass watch")

  trap("INT") {
    [jekyll_pid, compass_pid].each { |pid| Process.kill(9, pid) rescue Errno::ESRCH }
    exit 0
  }

  [jekyll_pid, compass_pid].each { |pid| Process.wait(pid) }

end

desc "Compile and generate all site files"
task :generate do

  puts "Compiling Sass."
  system "compass compile ."

  FileUtils.rm_r ".sass-cache", force: true

  puts "Generating site files."
  system "jekyll  --no-auto --no-server"

end


task :test do
  # current_branch = `git rev-parse --abbrev-ref HEAD`.strip
  # raise "### You must be on branch `gh-pages` to run deploy." unless current_branch == 'gh-pages'

  Rake::Task[:generate].invoke

  system "git checkout gh-pages"

  Dir.foreach "." do |item|
    keep = ['.git', 'CNAME', '_site']
    next if (['.', '..'] + keep).include? item
    rm_rf item
  end

  cp_r Dir["_site/*"], "."
  rm_rf "_site"

  system "git add ."
  system "git add -u"
  system "git commit -m 'Site deployed at #{Time.now.utc}'"
  system "git checkout master"

end