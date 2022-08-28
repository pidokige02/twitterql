import {ApolloServer, gql } from "apollo-server";
import fetch from "node-fetch";

// userId 은 다른 table data 와 join 하기 위한 foreign key 와 같은 것임
// 아래 두가지 배영 list 는 fake database 로 보면 됨
let tweets = [
    {
      id: "1",
      text: "first one!",
      userId: "2",
    },
    {
      id: "2",
      text: "second one",
      userId: "1",
    },
];

let users = [
    {
      id: "1",
      firstName: "nico",
      lastName: "las",
    },
    {
      id: "2",
      firstName: "Elon",
      lastName: "Mask",
    },
];

// gql 안에 schema definotion language 가 들어가게 된다.
// shape of data
// user 가 query 할 수 있는 모든 data schema 가 여기에 정의되어 있어애 한다.
// 마치 rest api 에서 사용가는한 url 을 모두정의하는 것 처럼.
const typeDefs = gql`
    type User {
        id: ID!
        firstName: String!
        lastName: String!
        """
        Is the sum of firstName + lastName as a string
        fullName is dynamic field
        """
        fullName: String!
    }
    """
    Tweet object represents a resource for a Tweet
    """
    type Tweet {
        id: ID!
        text: String!
        author: User!
    }
    """
    allMovies is query type, [Movie!]! is retuen type
    tweet(id: ID!): Tweet : argument 를 받아서 특정 user 의 tweet 을 조회할 수 있음
    """
    type Query {
        allMovies: [Movie!]!
        allUsers: [User!]!
        allTweets: [Tweet!]!
        tweet(id: ID!): Tweet
        movie(id: String!): Movie
        ping: String!
    }
    type Mutation {
        postTweet(text: String!, userId: ID!): Tweet!
        """
        Deletes a Tweet if found, else returns false
        """
        deleteTweet(id: ID!): Boolean!
    }

    type Movie {
    id: Int!
    url: String!
    imdb_code: String!
    title: String!
    title_english: String!
    title_long: String!
    slug: String!
    year: Int!
    rating: Float!
    runtime: Float!
    genres: [String]!
    summary: String
    description_full: String!
    synopsis: String
    yt_trailer_code: String!
    language: String!
    background_image: String!
    background_image_original: String!
    small_cover_image: String!
    medium_cover_image: String!
    large_cover_image: String!
  }
`;

// rest api 에서 GET /api/v1/tweets 이 graphql 에서 query 안에 allTweet를 넣는 것과 같다.
// GET /api/v1/tweet/:id ==> graphql 에서 tweet(id: ID!): Tweet 와 같다.
// POST /api/v1/tweets 은 rest api 로 tweet 를 만들고자 할때 사용됨
// graphql 에서는 mutation type 에 넣는다.
// postTweet(text: String!, userId: ID!): Tweet!
// argument text and userId have to be sent and Tweet has to be returned,
// DELETE  /api/v1/tweets ==> graphql 에서는 mutation type 에 넣는다.
// PUT /api/v1/tweets ==> graphql 에서는 mutation type 에 넣는다.

// resolve should have the same shape of our type definition

// first argument is root argument  second argumant is what I want for passing data
// 일반적인 경우에는 sql code 나 prosma code 가 여기에 있다.
// tweet(root, { id }) {
//   console.log("I'm called")
//   return tweets.find((tweet) => tweet.id === id);
// }

const resolvers = {
    Query: {
      allTweets() {
        return tweets;
      },
      tweet(root, { id }) {
        console.log("I'm called")
        console.log(root)
        return tweets.find((tweet) => tweet.id === id);
      },
      allUsers() {
        console.log("allUsers called!");
        return users;
      },
      allMovies() {
        return fetch("https://yts.mx/api/v2/list_movies.json")
          .then((r) => r.json())
          .then((json) => json.data.movies);
      },
      movie(_, { id }) {
        return fetch(`https://yts.mx/api/v2/movie_details.json?movie_id=${id}`)
          .then((r) => r.json())
          .then((json) => json.data.movie);
      },
      ping() {
        return "pong"
      }
    },
    Mutation: {
        postTweet(_, { text, userId }) {
          const userFind = users.find((user) => user.id === userId);
          if(!userFind) throw new error('userId is not find');
          
          const newTweet = {
            id: tweets.length + 1,
            text,
            userId
          };
          tweets.push(newTweet);
          return newTweet;
        },
        deleteTweet(_, { id }) {
          const tweet = tweets.find((tweet) => tweet.id === id);
          if (!tweet) return false;
          tweets = tweets.filter((tweet) => tweet.id !== id);
          return true;
        },
    },
    User: {
        fullName({ firstName, lastName }) {
          return `${firstName} ${lastName}`;
        },
    },
    Tweet: {
        author({ userId }) {
          return users.find((user) => user.id === userId);
        },
    },
};

// ApolloServer 에 schema parameter 를 넣지않으면 error 가 발생한다.
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Running on ${url}`);
});