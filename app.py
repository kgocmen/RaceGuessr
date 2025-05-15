from flask import Flask, request, jsonify, send_from_directory
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import euclidean_distances
import settings
import mix
import round as round_module

app = Flask(__name__, static_folder='game_ui')

DATA = pd.read_csv("illu_modern_with_coords.csv")
DATA.set_index("Population", inplace=True)
PC_COLUMNS = [f"PC{i}" for i in range(1, 26)]
CURRENT_STATE = {}

@app.route('/')
def index():
    return app.send_static_file("index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(app.static_folder, filename)

@app.route("/next_round")
def next_round():
    try:
        rtype = int(request.args.get("type", 5))
        custom_str = request.args.get("custom", None)
        if rtype == 6 and custom_str:
            selected = list(map(int, custom_str.split('-')))
            region_list = mix.get_round_regions(k=selected)
        else:
            region_list = mix.get_round_regions(k=rtype)

    except Exception as e:
        return jsonify({"error": f"Invalid region choice: {str(e)}"}), 400

    n = np.random.randint(2, 5)
    filtered = DATA[DATA["Region"].isin(region_list)]

    if len(filtered) < n:
        return jsonify({"error": "Not enough populations in selected regions"}), 400

    chosen_pops = np.random.choice(filtered.index, size=n, replace=False)

    while True:
        weights = np.random.choice(settings.WEIGHTS, size=n, replace=True)
        if weights.sum() == settings.TOTAL:
            break
    proportions = weights / settings.TOTAL

    vectors = filtered.loc[chosen_pops, PC_COLUMNS].values
    synthetic_vector = np.average(vectors, axis=0, weights=proportions)
    distances = 100 * euclidean_distances([synthetic_vector], DATA[PC_COLUMNS].values)[0]

    results = pd.DataFrame({"Population": DATA.index, "Distance": distances})
    results = results.sort_values(by="Distance").reset_index(drop=True)

    CURRENT_STATE.clear()
    CURRENT_STATE['vector'] = synthetic_vector
    CURRENT_STATE['results'] = results
    CURRENT_STATE['mix'] = {pop: round(p, 2) for pop, p in zip(chosen_pops, proportions)}
    CURRENT_STATE['regions'] = region_list

    return jsonify({
        "mix_description": CURRENT_STATE['mix'],
        "regions": region_list,
        "populations": list(chosen_pops)
    })

@app.route("/submit_guess", methods=["POST"])
def submit_guess():
    data = request.json
    guess = data.get("guess", "")

    if 'mix' not in CURRENT_STATE:
        return jsonify({"error": "Round data incomplete. Please start a new round."}), 400

    vector = CURRENT_STATE['vector']
    results = CURRENT_STATE['results']
    top10 = results.head(10)
    top10_names = top10["Population"].tolist()

    # Now safe to compute distance and rank
    guess_distance = float(results.loc[results["Population"] == guess, "Distance"].iloc[0])
    rank = int(results[results["Population"] == guess].index[0]) + 1

    if guess in top10_names:
        score = settings.SCORES[top10_names.index(guess)]
        message = f"✅ Rank {rank}/10"
    else:
        score = round_module.compute_fallback_score(guess, DATA, vector, results)
        message = f"⚠️ Rank {rank} (Fallback)"

    top10_data = top10.to_dict(orient='records')

    return jsonify({
        "score": score,
        "message": message,
        "rank": rank,
        "distance": guess_distance,
        "guess": guess,
        "top10": top10_data,
        "true_mix": CURRENT_STATE['mix'],
        "regions": CURRENT_STATE['regions']
    })


if __name__ == '__main__':
    app.run(debug=True)
