from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# --- Load data dari JSON ---
with open("rules.json", "r") as f:
    knowledge = json.load(f)

gejala = knowledge["gejala"]
aturan = knowledge["aturan"]

@app.route("/")
def home():
    return render_template("index.html", gejala=gejala)

@app.route("/infer", methods=["POST"])
def infer():
    data = request.json
    cf_user = data["cf_user"]  # dict {"G1": 1.0, "G2": 0.5, ...}

    hasil_diagnosa = {}

    # Loop setiap rule
    for rule in aturan:
        kondisi = rule["if"]
        cf_pakar = rule["cf"]

        # Cek apakah semua gejala rule ada di input user
        if all(g in cf_user for g in kondisi):
            # Ambil nilai CF user terendah dari gejala-gejala tersebut
            cf_min_user = min(cf_user[g] for g in kondisi)
            cf_rule = cf_pakar * cf_min_user

            penyakit = rule["then"]

            # Jika penyakit sudah ada sebelumnya → gabungkan CF
            if penyakit in hasil_diagnosa:
                cf_lama = hasil_diagnosa[penyakit]
                cf_baru = cf_lama + cf_rule - (cf_lama * cf_rule)
                hasil_diagnosa[penyakit] = cf_baru
            else:
                hasil_diagnosa[penyakit] = cf_rule

    # Ubah ke persentase dan urutkan
    hasil_akhir = [
        {"penyakit": p, "cf": round(v * 100, 2)} for p, v in hasil_diagnosa.items()
    ]
    hasil_akhir.sort(key=lambda x: x["cf"], reverse=True)

    return jsonify({"hasil": hasil_akhir})


if __name__ == "__main__":
    app.run(debug=True)
