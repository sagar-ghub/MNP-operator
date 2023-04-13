const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLID,

  GraphQLList,
  GraphQLScalarType,
} = require("graphql");

const User = require("../models/UserSchema");
const Plan = require("../models/PlanSchema");
const MNP = require("../models/MnpSchema");
const findData = () => {
  return "calculation result";
};
const MNPtype = new GraphQLObjectType({
  name: "MNP",
  //We are wrapping fields in the function as we don’t want to execute this until
  //everything is inilized. For example below code will throw an error AuthorType not
  //found if not wrapped in a function
  fields: () => ({
    id: { type: GraphQLID },
    mobile: { type: GraphQLString },
    operator_id: { type: GraphQLString },
    mobile_code: { type: GraphQLString },
    circle_id: { type: GraphQLString },
    circle_code: { type: GraphQLString },
    is_port: { type: GraphQLString },
  }),
});
const PlanType = new GraphQLScalarType({
  name: "PlanType",
  description: "A custom scalar type",
  serialize(value) {
    return value;
  },
  parseValue(value) {
    return JSON.parse(value);
  },
  parseLiteral(ast) {
    // Convert incoming AST to JSON
    return JSON.parse(ast.value);
  },
});

const getPlan = async (args) => {
  const operator = await Plan.findOne(
    {
      $and: [
        {
          operator_id: args.operator_id,
        },
        {
          circles: { $elemMatch: { circle_id: args.circle_id } },
        },
      ],
    },
    "circles.$"
  );
  if (!operator) {
    return false;
  }
  const plan = operator.circles[0].plan;
  let final_plan = {};
  if (!args.amount) {
    return plan;
  }
  for (const key in plan) {
    let arr = [...plan[key]];
    // console.log("asa", arr);
    final_plan = arr.find((p) => {
      // console.log(p.amount, amount);
      return p.amount == args.amount;
    });
    // console.log(final_plan);
    if (final_plan) break;
  }
  if (!final_plan) {
    return false;
  }

  return final_plan;
};

//design a mutation to add money to wallet in userschema

const SpecialPlanType = new GraphQLObjectType({
  name: "SpecialPlan",
  fields: () => ({
    amount: { type: GraphQLString },
    validity: { type: GraphQLString },
    sms: { type: GraphQLString },
    is_valid: { type: GraphQLString },
    talktime: { type: GraphQLString },
    disclaimer: { type: GraphQLString },
    description: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    hello: {
      type: GraphQLString,
      resolve: () => findData(),
    },
    MNP: {
      type: MNPtype,
      args: { mobile: { type: GraphQLString } },
      async resolve(parent, args) {
        const data = await MNP.findOne({ mobile: args.mobile });
        // console.log(data);
        return data;
      },
    },
    PlanAmount: {
      type: SpecialPlanType,
      args: {
        operator_id: { type: GraphQLString },
        circle_id: { type: GraphQLString },
        amount: { type: GraphQLString },
      },
      async resolve(parent, args) {
        console.log(args);
        const data = await getPlan(args);
        if (!data) {
          return {
            amount: false,
            validity: false,
            sms: false,
            is_valid: 0,
            talktime: false,
            disclaimer: false,
            description: false,
          };
        }

        return data;
      },
    },

    Plans: {
      type: PlanType,
      args: {
        operator_id: { type: GraphQLString },
        circle_id: { type: GraphQLString },
      },
      async resolve(parent, args) {
        console.log(args);
        const data = await getPlan(args);
        // if (!data) {
        //   return {
        //     amount: false,
        //     validity: false,
        //     sms: false,
        //     is_valid: 0,
        //     talktime: false,
        //     disclaimer: false,
        //     description: false,
        //   };
        // }

        return data;
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
});

module.exports = { schema };
