const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  redisClient,
  spacesToUnderscores,
  underscoresToSpaces
} = require('../redisClient');

const addToWatchlist = async (req, res) => {
  try {
    const { companyName } = req.body;
    const userId = req.user.id;

    const watchlistItem = await prisma.watchlist.findUnique({
      where: {
        userId_companyName: {
          userId,
          companyName,
        },
      },
    });

    if (watchlistItem) {
      return res.status(400).json({ error: "Company already in watchlist" });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId,
        companyName,
      },
    });

    return res.status(201).json({ message: "Added to watchlist" });
  } catch (error) {
    console.error("Error adding to watchlist:", error);
    return res.status(500).json({ error: "Error adding to watchlist" });
  }
};

const removeFromWatchlist = async (req, res) => {
  try {
    const { companyName } = req.body;
    const userId = req.user.id;

    await prisma.watchlist.delete({
      where: {
        userId_companyName: {
          userId,
          companyName,
        },
      },
    });

    res.status(200).json({ message: "Removed from watchlist" });
  } catch (error) {
    console.error("Error removing from watchlist:", error);
    res.status(500).json({ error: "Error removing from watchlist" });
  }
};

const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    let watchlist = await prisma.watchlist.findMany({
      where: { userId },
      select: { 
        companyName: true,
        company: {
          select: {
            name: true,
            group: true,
            sector: true,
            ticker: true,
        }
      }
       },
    });

    watchlist = watchlist.map(item => ({
      companyName: item.companyName,
      ticker: item.company.ticker,
      group: item.company.group,
      sector: item.company.sector,
    }));

    for(let i = 0; i < watchlist.length; i++){
      // console.log(undwatchlist[i].companyName);
      watchlist[i].price = await  redisClient.get(`${spacesToUnderscores(watchlist[i].companyName)}:open`);
    }

    

    res.status(200).json(watchlist);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ error: "Error fetching watchlist" });
  }
};


const isCompanyBookmarked = async (req, res) => {
  try{
    const user = req.user
    const userId = user.id

    const { companyName } = req.body

    const watchlistItem = await prisma.watchlist.findUnique({
      where: {
        userId_companyName: {
          userId,
          companyName,
        },
      },
    });

    if(watchlistItem){
      return  res.status(200).json({ message: "Company is bookmarked", is_marked : true });
    }

    return res.status(200).json({ message: "Company is not bookmarked", is_marked : false });
  }

  catch(error){
    console.error("Error checking if company is bookmarked:", error);
    res.status(500).json({ error: "Error checking if company is bookmarked" });
  }

}


module.exports = { addToWatchlist, removeFromWatchlist, getWatchlist, isCompanyBookmarked };
