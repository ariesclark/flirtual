import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";

import { temporaryDirectory } from "../consts";
import { log } from "../log";

import type { Classifier } from ".";

export type Result = Record<string, number>;

export const classify: Classifier<Result> = async (imageIds, groupFile) => {
	const map = new Map<string, Result>();

	await new Promise((resolve, reject) => {
		// Spawn the Python process.
		const process = spawn(
			"python3",
			[
				"deepdanbooru/__main__.py",
				"evaluate",
				path.resolve(temporaryDirectory, groupFile),
				"--project-path",
				"./",
				"--allow-folder",
				"--save-json"
			],
			{
				cwd: "deep-danbooru"
			}
		);

		process.stderr.on("data", (data) =>
			log.error({ groupFile, classifierId: "deepDanbooru" }, data.toString())
		);

		process.on("error", reject);
		process.on("close", resolve);
	});

	// Deep Danbooru outputs a JSON file for each image.
	// We read the files and parse them into a map.
	await Promise.all(
		imageIds.map(async (imageId) => {
			const content = await fs.readFile(
				path.resolve(temporaryDirectory, groupFile, `${imageId}.json`),
				"utf-8"
			);
			const data = JSON.parse(content) as Record<string, string>;

			map.set(
				imageId,
				Object.fromEntries(
					Object.entries(data).map(([tag, probability]) => [
						tag,
						// Round the probability to 4 decimal places.
						parseFloat(parseFloat(probability).toFixed(4))
					])
				)
			);
		})
	);

	return map;
};
