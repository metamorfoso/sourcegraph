package api

import (
	"context"

	"github.com/pkg/errors"
	bundles "github.com/sourcegraph/sourcegraph/internal/codeintel/bundles/client"
	"github.com/sourcegraph/sourcegraph/internal/codeintel/db"
)

func lookupMoniker(
	db db.DB,
	bundleManagerClient bundles.BundleManagerClient,
	dumpID int,
	path string,
	modelType string,
	moniker bundles.MonikerData,
	skip int,
	take int,
) ([]ResolvedLocation, int, error) {
	if moniker.PackageInformationID == "" {
		return nil, 0, nil
	}

	pid, err := bundleManagerClient.BundleClient(dumpID).PackageInformation(context.Background(), path, moniker.PackageInformationID)
	if err != nil {
		return nil, 0, errors.Wrap(err, "bundleManagerClient.BundleClient")
	}

	dump, exists, err := db.GetPackage(context.Background(), moniker.Scheme, pid.Name, pid.Version)
	if err != nil || !exists {
		return nil, 0, errors.Wrap(err, "db.GetPackage")
	}

	locations, count, err := bundleManagerClient.BundleClient(dump.ID).MonikerResults(context.Background(), modelType, moniker.Scheme, moniker.Identifier, skip, take)
	if err != nil {
		return nil, 0, errors.Wrap(err, "bundleManagerClient.BundleClient")
	}

	return resolveLocationsWithDump(dump, locations), count, nil
}
