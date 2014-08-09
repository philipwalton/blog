ingen := ../ingen/bin/ingen

test:
	@ jshint --show-non-errors _scripts

build:
	@ echo ">>> Building site..."
	@ $(ingen) build

debug:
	@ echo ">>> Debug site..."
	@ node --debug-brk $(ingen) build

preview:
	@ echo ">>> Previewing site on port 4000..."
	@ $(ingen) serve -wi --env development

deploy: build
	@ rm -rf '_tmp' && mkdir '_tmp'
	@ echo ">>> Updating gh-pages branch..."
	@ cd _tmp && \
		git init && \
		git remote add origin git@github.com:philipwalton/blog.git && \
		git pull origin gh-pages && \
		rm -rf ./* && \
		cp -rf ../_site/ ./ && \
		git add -A && \
		git commit -m "Deploy site." && \
		git branch -m gh-pages && \
		git push origin gh-pages
	@ echo ">>> Cleaning up..."
	@ rm -rf _site _tmp
	@ echo "*** Successfully deployed site!"

.PHONY: test build debug preview deploy
