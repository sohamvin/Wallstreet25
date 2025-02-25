const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const DEFAULT_CASH = 900000.0;
const { createClient } = require('redis');
const redisClient = createClient({ url: 'redis://localhost:6379' });
const bcrypt = require('bcrypt');

const signup = async (req, res) => {
  const { username, email, name, password, friends } = req.body;
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
          OR: [
              { email: email },
              { username: username }
          ]
      }
  });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // console.log("Creating user: ", email, name, password);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        password: hashedPassword,
        friends: friends

      },
    });

    return res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    res.status(400).json({ error: "Error creating user" });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // if(!user || user.password !== password) {
    //     return res.status(401).json({ error: "Invalid email or password" });
    // }
    const token = jwt.sign({ id: user.id, email: user.email, cash: user.cash }, process.env.JWT_SECRET);
    return res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(400).json({ error: "Error logging in" });
  }
};

// const signup = async (req, res) => {
//   const { email, name, password } = req.body;
//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ error: "User already exists" });
//     }

//     console.log("Creating user: ", email, name, password);

//     // const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await prisma.user.create({
//       data: {
//         email,
//         name,
//         password: password,
//         cash: DEFAULT_CASH,
//         lockedCash: 0.0,
//         userLocked: false,
//       },
//     });

//     return res.status(200).json({ message: "User created successfully" });
//   } catch (error) {
//     res.status(400).json({ error: "Error creating user" });
//   }
// };

// const login = async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await prisma.user.findUnique({ where: { email } });
//     // if (!user || !(await bcrypt.compare(password, user.password))) {
//     //   return res.status(401).json({ error: "Invalid email or password" });
//     // }
//     if(!user || user.password !== password) {
//         return res.status(401).json({ error: "Invalid email or password" });
//     }
//     const token = jwt.sign({ id: user.id, email: user.email, cash: user.cash }, process.env.JWT_SECRET);
//     return res.json({ message: "Login successful", token });
//   } catch (error) {
//     res.status(400).json({ error: "Error logging in" });
//   }
// };

const logout = (req, res) => {
  // Invalidate the token on the client side
  res.json({ message: "Logout successful" });
};


redisClient.on('error', (err) => {
    console.error('[Redis] Client Error:', err);
});

async function setupRedis() {
    try {
        await redisClient.connect();
        console.log('[Redis] Connected successfully');
    } catch (err) {
        console.error('[Redis] Connection Error:', err);
        process.exit(1);
    }
}
setupRedis();


function spacesToUnderscores(str) {
  return str.replace(/ /g, "_");
}

function underscoresToSpaces(str) {
  return str.replace(/_/g, " ");
}

const getUsersWithRankings = async () => {
    const users = await prisma.user.findMany({
      where: {
        friends: false,
      },
        select: {
            id: true,
            cash: true,
            name: true,
            holdings: {
                select: {
                    quantity: true,
                    averagePrice: true,
                    companyName: true,
                }
            }
        },
    });

    const getAllCompanies = await prisma.company.findMany({
        select: {
            name: true,
        },
    });

    const companyNames = getAllCompanies.map((company) => company.name);

    const companyPrices = await Promise.all(companyNames.map(async (companyName) => {
        const JsonObj = await redisClient.get(spacesToUnderscores(companyName));
        const json = typeof JsonObj === 'string' ? JSON.parse(JsonObj) : JsonObj;
        const price = parseFloat(json.price);
        return { company: companyName, price: price };
    }));

    const companyPriceMap = companyPrices.reduce((acc, { company, price }) => {
        acc[company] = price;
        return acc;
    }, {});

    const usersWithTotalValue = users.map((user) => {
        const totalHoldingsValue = user.holdings.reduce((acc, holding) => {
            const price = companyPriceMap[holding.companyName] || 0;
            return acc + (holding.quantity * price);
        }, 0);
        const totalValue = parseFloat(user.cash) + parseFloat(totalHoldingsValue);
        return { name: user.name, cash : user.cash, totalValue };
    });

    const rankedUsers = usersWithTotalValue.sort((a, b) => b.totalValue - a.totalValue);

    return rankedUsers;
};

const getUserRankings = async (req, res) => {
    try {
        const rankedUsers = await getUsersWithRankings();
        res.json(rankedUsers);
    } catch (error) {
        console.error('Error fetching user rankings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports = { signup, login, logout, getUserRankings };
