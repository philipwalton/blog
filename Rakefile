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

  puts "Generating site files."
  system "jekyll  --no-auto --no-server"

end

task :deploy do

  # current_branch = `git rev-parse --abbrev-ref HEAD`.strip
  # local_changes = `git diff`.strip

  # unless current_branch == "master" && local_changes.length == 0
  #   raise "### You must be on branch master with no local changes to run deploy"
  # end

  Rake::Task[:generate].invoke

  # Create a temp repo to pull the latest remote gh-pages files from

  mkdir "_tmp"
  cd "_tmp" do
    system "git init"
    system "git remote add origin git@github.com:philipwalton/blog.git"
    system "git pull origin gh-pages"
    system "rm -rf *" # remove all files
    system "cp -r ../_site/ ./" # copy over all the newly deployed files
    system "git add . && git add -u"
    system "git commit -m 'Site deployed at #{Time.now.utc}'"
    system "git branch -m gh-pages"
    system "git push origin gh-pages"
  end

  # Remove the `_site` and `_tmp` directories, destroy the temp repo
  rm_rf "_site"
  rm_rf "_tmp"

end


# task :deploy do

#   current_branch = `git rev-parse --abbrev-ref HEAD`.strip
#   local_changes = `git diff`.strip

#   unless current_branch == "master" && local_changes.length == 0
#     raise "### You must be on branch master with no local changes to run deploy"
#   end


#   Rake::Task[:generate].invoke

#   # Create a temp repo in `_site/` that we'll fake as the gh-pages branch
#   cd "_site" do
#     system "git init"
#     system "git add ."
#     system "git commit -m 'Site deployed at #{Time.now.utc}'"
#     system "git branch -m gh-pages"
#     system "git remote add origin git@github.com:philipwalton/blog.git"
#     system "git push origin gh-pages --force"
#   end

#   # Remove the `_site` directory and the temp repo with it
#   rm_rf "_site"

# end