const fs = require('fs');
const axios = require('axios').default;
const inquirer = require('inquirer');
const pdf = require('html-pdf');

const questions = [
    {
        type: 'input',
        message: 'What is your favorit color?',
        name: 'color'
    },
    {
        type: 'input',
        message: 'Enter a GitHub user name.',
        name: 'userName'
    }
];

async function getInputs(){
    let res = await inquirer.prompt(questions).then(function(response){
        console.log(response);
        return response;
    });
    return res;
}

async function queryGithub(userName) {
    // get user data
    let response;
    try {
      const queryUrl = `https://api.github.com/users/${userName}`;
      response = await axios.get(queryUrl);
      //console.log(response);
      //return response;
    } catch (error) {
      console.error(error);
    }

    // get user starred data
    try {
        const queryUrl = `https://api.github.com/users/${userName}/starred`;
        const starResponse = await axios.get(queryUrl);
        //console.log(starResponse);
        //console.log(starResponse.data);
        return {...response.data, num_stars: starResponse.data.length};
      } catch (error) {
        console.error(error);
      }
}

async function main(){
    let inputs = await getInputs();
    let bgColor = inputs.color;
    let userName = inputs.userName;
    let ghd = await queryGithub(userName);
    //console.log(bgColor);
    //console.log(githubData);
    let minimalGithubData = {
        prof_img: ghd.avatar_url,
        user : ghd.name,
        loc : ghd.location,
        prof: ghd.html_url,
        blog: ghd.blog,
        bio: ghd.bio,
        num_pub_repos: ghd.public_repos,
        num_followers: ghd.followers,
        num_following: ghd.following,
        num_stars: ghd.num_stars
    }
    console.log(minimalGithubData);//minimalGithubData);

}

main()