import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import conn from '../db/conn';

// getting a single game
const getGame = async (req: Request, res: Response, next: NextFunction) => {
    // get the game id from the req
    let id: string = req.params.id;
    // get the game

    let result: any;
    const collection = conn;
    // perform actions on the collection object
    let query = {id: id};
    result = await collection.findOne(query);

    if (!result) {
        let apiResult = await axios.get(`https://chumley.barstoolsports.com/dev/data/games/${id}.json`);
        let newDocument = apiResult.data;
        newDocument.id = id;
        newDocument.date = new Date();
        await collection.insertOne(newDocument);
        result = apiResult.data;
    } else {
        const resultTime = result.date.getTime() / 1000;
        const currentTime = new Date().getTime() / 1000;
        if ((currentTime - resultTime) > 15) {
            let apiResult = await axios.get(`https://chumley.barstoolsports.com/dev/data/games/${id}.json`);
            let updatedDocument = apiResult.data; 
            updatedDocument.id = id;
            updatedDocument.date = new Date();
            await collection.replaceOne(query, updatedDocument);
            result = apiResult.data;
        }
    }

    let game = result;

    const totals = (team: string) => {
        if (game.league === 'MLB') {
            return game[`${team}_batter_totals`].runs;
        } else {
            return game[`${team}_totals`].points;
        }
    }

    return res.status(200).json({
        ...game,
        awayTeam: {
            abbreviation: game.away_team.abbreviation,
            name: game.away_team.first_name,
            nickname: game.away_team.last_name,
            color: '#1345B9', // hard-coding this for now, as I don't see the option currently available in the API
            // I'm assuming for the field below, there will always be an entry to every scoring period
            // so when the game has just started, it could look like ['0', '0', '0', '0']
            //
            // A clarification I'd make when actually working on the product
            scoring: game.away_period_scores,
            hits: game.away_batter_totals ? game.away_batter_totals.hits.toString() : null,
            errors: game.away_errors ? game.away_errors : null,
            score: totals('away'),
            record: '42-28' // hard-coding this for now, as I don't see the option currently available in the API
        },
        homeTeam: {
            abbreviation: game.home_team.abbreviation,
            name: game.home_team.first_name,
            nickname: game.home_team.last_name,
            color: '#C50E0E', // hard-coding this for now, as I don't see the option currently available in the API
            // I'm assuming for the field below, there will always be an entry to every scoring period
            // so when the game has just started, it could look like ['0', '0', '0', '0']
            //
            // A clarification I'd make when actually working on the product
            scoring: game.home_period_scores,
            score: totals('home'),
            hits: game.home_batter_totals ? game.home_batter_totals.hits : null,
            errors: game.home_errors !== undefined ? game.home_errors.toString() : null,
            record: '42-28' // hard-coding this for now, as I don't see the option currently available in the API
        },
        eventInfo: {
            // I'm assuming for the field below, if the game was being played, this field would show the time/current period
            //
            // A clarification I'd make when actually working on the product
            status: game.event_information.status === 'completed' ? 'Final' : game.event_information.status,
        }
    });
};


export default { getGame };
